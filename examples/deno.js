/* global Deno */
import Client from 'https://unpkg.com/drand-client/drand.js'
import Twitter from 'https://unpkg.com/@alanshaw/drand-client-twitter?module'
import chainInfo from './loe-chain-info.js'

async function getCredentials () {
  const dirname = new URL(import.meta.url).pathname.split('/').slice(0, -1).join('/')
  return JSON.parse(await Deno.readTextFile(`${dirname}/credentials.json`))
}

async function main () {
  const { bearerToken } = await getCredentials()
  const c = await Client.wrap([
    new Twitter({ screenName: 'loebot', bearerToken, chainInfo })
  ], { chainInfo })

  for await (const res of c.watch()) {
    console.log(res)
  }
}

main().catch(console.error)
