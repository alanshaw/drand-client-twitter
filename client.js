/* eslint-env browser */
import { hexToBuffer, bufferToHex, sha256, streamToIterable, ndjsonParse } from './util.js'

const SCREEN_NAME = 'loebot'

export default class Client {
  constructor (options) {
    options = options || {}
    if (!options.bearerToken) throw new Error('bearer token required')
    this._options = options
    this._chainInfo = options.chainInfo
    this._screenName = options.screenName || SCREEN_NAME
    this._ruleTag = `drand-client-twitter-watch-${this._screenName}`
  }

  async info (options) {
    if (this._chainInfo) return this._chainInfo
    // TODO: fetch from profile description or something if chainHash option set
  }

  async get (round, options) {
  }

  async _addRule (options) {
    options = options || {}

    const res = await fetch('https://api.twitter.com/labs/1/tweets/stream/filter/rules', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this._options.bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        add: [{ tag: this._ruleTag, value: `from:${this._screenName}` }]
      }),
      signal: options.signal
    })

    if (!res.ok) {
      throw new Error('adding rule ' + res.status)
    }
  }

  async * watch (options) {
    options = options || {}

    await this._addRule(options)

    const res = await fetch(
      'https://api.twitter.com/labs/1/tweets/stream/filter',
      {
        headers: { Authorization: `Bearer ${this._options.bearerToken}` },
        signal: options.signal
      }
    )

    if (!res.ok) {
      throw new Error('streaming tweets: HTTP status: ' + res.status)
    }

    let prevBeacon
    console.log('TODO: get and yield current beacon')
    // prevBeacon = await this.get()
    // yield prevBeacon

    for await (const msg of ndjsonParse(streamToIterable(res.body))) {
      if (!msg.matching_rules.some(r => r.tag === this._ruleTag)) {
        continue
      }

      let beacon
      try {
        beacon = JSON.parse(msg.data.text)
      } catch (err) {
        console.warn('parsing tweet', err)
        continue
      }

      if (!prevBeacon || prevBeacon.round !== beacon.round - 1) {
        console.log('TODO: missing previous beacon', beacon.round - 1)
        prevBeacon = null
        // prevBeacon = this.get(beacon.round - 1, { signal: options.signal })
      }

      beacon.previous_signature = prevBeacon && prevBeacon.signature
      const hash = await sha256(hexToBuffer(beacon.signature))
      beacon.randomness = bufferToHex(hash)

      yield beacon
      prevBeacon = beacon
    }
  }
}
