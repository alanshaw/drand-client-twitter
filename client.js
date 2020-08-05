/* eslint-env browser */
import Chain from 'drand-client/chain.js'
import PollingWatcher from 'drand-client/polling-watcher.js'
import { controllerWithParent } from 'drand-client/abort.js'
import { hexToBuffer, bufferToHex, sha256, retry, pause } from './util.js'

// Screen name of the twitter bot to use.
const SCREEN_NAME = 'loebot'
// Maximum retries for getting the latest round before it fails.
const LATEST_ROUND_RETRIES = 10
// Backoff interval in ms between retries - doubled each retry.
const LATEST_ROUND_RETRY_BACKOFF = 50
// Expected delay in ms between randomness being generated and it being
// available on twitter, reduce this for faster latest randomness but more
// requests to twitter.
const LATEST_ROUND_DELAY = 650
// Maximum number of tweets that can be requested from the twitter API.
const MAX_TWEET_COUNT = 200

export default class Client {
  constructor (options) {
    options = options || {}
    if (!options.bearerToken) throw new Error('bearer token required')
    if (!options.chainInfo) throw new Error('chain info required')
    this._options = options
    this._chainInfo = options.chainInfo
    this._screenName = options.screenName || SCREEN_NAME
    this._watcher = new PollingWatcher(this, options.chainInfo)
    this._controllers = []
  }

  async info () {
    return this._chainInfo
  }

  async get (round, options) {
    options = options || {}
    const now = new Date()
    const latestRound = this.roundAt(now.getTime())
    round = round || latestRound

    const controller = controllerWithParent(options.signal)
    this._controllers.push(controller)

    try {
      let rand
      if (round === latestRound) {
        const latestRoundTime = this._roundTime(latestRound)
        const delay = this._options.latestRoundDelay || LATEST_ROUND_DELAY
        if (now - latestRoundTime < delay) {
          // console.log('in delay period, pausing for ', latestRoundTime + delay - now, 'ms')
          await pause(latestRoundTime + delay - now, { signal: options.signal })
        }
        rand = await retry(() => this._get(round, { ...options, count: 2 }), {
          times: this._options.latestRoundRetries || LATEST_ROUND_RETRIES,
          backoff: this._options.latestRoundRetryBackoff || LATEST_ROUND_RETRY_BACKOFF,
          signal: options.signal
        })
      } else {
        rand = await this._get(round, options)
      }
      return rand
    } finally {
      this._controllers = this._controllers.filter(c => c !== controller)
      controller.abort()
    }
  }

  async _get (round, options) {
    let maxID
    while (true) {
      let url = `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${this._screenName}&count=${options.count || MAX_TWEET_COUNT}&trim_user=true&include_rts=false&exclude_replies=true&tweet_mode=extended`
      if (maxID) {
        url += '&max_id=' + maxID
      }
      // console.log('_get', url)
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this._options.bearerToken}` },
        signal: options.signal
      })
      if (!res.ok) {
        throw new Error('getting tweets: HTTP status: ' + res.status)
      }
      const data = await res.json()
      const beacons = data
        .map(t => {
          try {
            return JSON.parse(t.full_text)
          } catch (err) {
            console.warn('parsing tweet', err)
          }
        })
        .filter(Boolean)

      const beaconIndex = beacons.findIndex(b => b.round === round)

      if (beaconIndex !== -1) {
        const beacon = beacons[beaconIndex]
        let prevBeacon = beacons.find(b => b.round === round - 1)
        if (!prevBeacon) {
          const url = `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${this._screenName}&count=2&trim_user=true&include_rts=false&exclude_replies=true&tweet_mode=extended&max_id=${data[beaconIndex].id_str}`
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${this._options.bearerToken}` },
            signal: options.signal
          })
          if (!res.ok) {
            throw new Error('getting historic previous beacon tweet: HTTP status: ' + res.status)
          }
          const prevData = await res.json()
          if (prevData.length !== 2) {
            throw new Error(`beacon not found ${round - 1}`)
          }
          prevBeacon = JSON.parse(prevData[prevData.length - 1].full_text)
          if (prevBeacon.round !== round - 1) {
            throw new Error(`expected previous beacon ${round - 1} but got ${prevBeacon.round}`)
          }
        }
        beacon.previous_signature = prevBeacon.signature
        const hash = await sha256(hexToBuffer(beacon.signature))
        beacon.randomness = bufferToHex(hash)
        return beacon
      }

      // Passed the round we were looking for
      if (beacons.length && beacons[beacons.length - 1].round < round) {
        throw new Error(`beacon not found ${round}`)
      }
      // No more results
      if (!data.length || maxID === data[data.length - 1].id_str) {
        throw new Error(`beacon not available ${round}`)
      }
      maxID = data[data.length - 1].id_str
    }
  }

  async * watch (options) {
    yield * this._watcher.watch(options)
  }

  roundAt (time) {
    return Chain.roundAt(time, this._chainInfo.genesis_time * 1000, this._chainInfo.period * 1000)
  }

  _roundTime (round) {
    return Chain.roundTime(round, this._chainInfo.genesis_time * 1000, this._chainInfo.period * 1000)
  }

  async close () {
    this._controllers.forEach(c => c.abort())
    this._controllers = []
    await this._watcher.close()
  }
}
