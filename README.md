# drand-client-twitter

[![dependencies Status](https://david-dm.org/alanshaw/drand-client-twitter/status.svg)](https://david-dm.org/alanshaw/drand-client-twitter)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

A client for the drand twitter relay.

## Install

In [Deno](https://deno.land) you can grab and use the client from a CDN e.g. https://unpkg.com/@alanshaw/drand-client-twitter?module.

In [Node.js](https://nodejs.org), install with:

```sh
npm i @alanshaw/drand-client-twitter
```

## Usage

The client uses the [user timeline API](https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-user_timeline) exclusively. It is best suited for watching or getting the latest randomness generated. It's possible to get historic randomness up to the API limits of around 3,200 tweets. In order to retrieve historic randomness the client will walk the chain of tweets (max 200 per page).

**Deno**

```js
import Client from 'https://unpkg.com/drand-client/drand.js'
import Twitter from 'https://unpkg.com/@alanshaw/drand-client-twitter?module'

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

**Node.js**

```js
import Client from 'drand-client'
import Twitter from '@alanshaw/drand-client-twitter'
import fetch from 'node-fetch'
import AbortController from 'abort-controller'

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

### Running the examples

Add `credentials.json` to the `examples/` directory like:

```json
{
  "bearerToken": "AAAAAAAAAAAAAAAAAAAAAHJT..."
}
```

Run a client that watches for randomness and prints it to the console:

```sh
node ./examples/node.js
# or
deno run --allow-net --allow-read ./examples/deno.js
```

## API

See the drand client [API Reference docs](https://github.com/drand/drand-client#api).

## Contribute

Feel free to dive in! [Open an issue](https://github.com/alanshaw/drand-client-twitter/issues/new) or submit PRs.

## License

[MIT](LICENSE) © Alan Shaw
