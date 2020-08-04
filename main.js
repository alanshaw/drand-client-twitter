/* global process, Deno */
import Client from './client.js'

async function getCredentials () {
  if (typeof process !== 'undefined') {
    const fs = await import('fs')
    return JSON.parse(fs.readFileSync('./credentials.json', 'utf8'))
  }
  if (typeof Deno !== 'undefined') {
    return JSON.parse(await Deno.readTextFile('./credentials.json'))
  }
  throw new Error('unknown environment')
}

async function main () {
  if (typeof process !== 'undefined') {
    global.fetch = (await import('node-fetch')).default
  }

  const { bearerToken } = await getCredentials()
  const c = new Client({ bearerToken })

  for await (const res of c.watch()) {
    console.log(res)
  }
}

main()
