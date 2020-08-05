/* global Deno */
import Client from 'https://deno.land/x/drand_client/drand.js'
import Twitter from '../client.js'
import chainInfo from './loe-chain-info.js'

async function getCredentials () {
  return JSON.parse(await Deno.readTextFile('./credentials.json'))
}

async function main () {
  const { bearerToken } = await getCredentials()
  const c = await Client.wrap([
    new Twitter({ bearerToken, chainInfo })
  ], { chainInfo })

  for await (const res of c.watch()) {
    console.log(res)
  }
}

main().catch(console.error)
