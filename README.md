# drand-client-twitter

⚠️ WIP

## Usage

### Demo

Add `credentials.json` to the project root like:

```json
{
  "bearerToken": "AAAAAAAAAAAAAAAAAAAAAHJT..."
}
```

Note: The credentials MUST have access to the _labs_ endpoint https://api.twitter.com/labs/1/tweets/stream/filter.

Run a client that watches for randomness and prints it to the console:

```sh
deno run --allow-net --allow-read ./main.js
# or
node ./main.js
```
