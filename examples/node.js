import fs from 'fs'
import fetch from 'node-fetch'
import AbortController from 'abort-controller'
import Client from 'drand-client'
import Twitter from '../client.js'
import chainInfo from './loe-chain-info.js'

global.fetch = fetch
global.AbortController = AbortController

function getCredentials () {
  const dirname = new URL(import.meta.url).pathname.split('/').slice(0, -1).join('/')
  return JSON.parse(fs.readFileSync(`${dirname}/credentials.json`, 'utf8'))
}

async function main () {
  const { bearerToken } = getCredentials()
  const c = await Client.wrap([
    new Twitter({ bearerToken, chainInfo })
  ], { chainInfo })

  for await (const res of c.watch()) {
    console.log(res)
  }
}

main().catch(console.error)
