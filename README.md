# drand-client-twitter

A client for the drand twitter relay.

## Install

```sh
npm i @alanshaw/drand-client-twitter
```

## Usage

### Node.js

```js
import fetch from 'node-fetch'
import AbortController from 'abort-controller'
import Client from 'drand-client'
import Twitter from '@alanshaw/drand-client-twitter'

global.fetch = fetch
global.AbortController = AbortController

const chainInfo = {
  public_key: '868f005eb8e6e4ca0a47c8a77ceaa5309a47978a7c71bc5cce96366b5d7a569937c529eeda66c7293784a9402801af31',
  period: 30,
  genesis_time: 1595431050,
  hash: '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce'
}

async function main () {
  const c = await Client.wrap([
    new Twitter({ bearerToken: 'AAAAAAAAAAAAAAAAAAAAAHJT...', chainInfo })
  ], { chainInfo })

  for await (const res of c.watch()) {
    console.log(res)
  }
}

main()
```

### Demo

Add `credentials.json` to the examples directory like:

```json
{
  "bearerToken": "AAAAAAAAAAAAAAAAAAAAAHJT..."
}
```

Run a client that watches for randomness and prints it to the console:

```sh
node ./examples/node.js
```
