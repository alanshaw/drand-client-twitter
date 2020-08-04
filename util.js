/* eslint-env browser */
/* global process, Deno */

export async function sha256 (buf) {
  // Browser
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    return crypto.subtle.digest('SHA-256', buf)
  }

  // Node.js
  if (typeof process !== 'undefined') {
    const crypto = await import('crypto')
    return crypto.createHash('sha256').update(buf).digest()
  }

  // Deno
  if (typeof Deno !== 'undefined') {
    const { Sha256 } = await import('https://deno.land/x/sha2@1.0.0/mod/sha256.ts')
    return new Sha256().hashToBytes(buf)
  }

  throw new Error('no supported crypto implementation found')
}

export function hexToBuffer (str) {
  return new Uint8Array(str.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)))
}

export function bufferToHex (buf) {
  return Array.prototype.map.call(new Uint8Array(buf), x => ('00' + x.toString(16)).slice(-2)).join('')
}

export function streamToIterable (stream) {
  if (stream[Symbol.asyncIterator]) return stream

  // Browser ReadableStream
  if (stream.getReader) {
    return (async function * () {
      const reader = stream.getReader()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) return
          yield value
        }
      } finally {
        reader.releaseLock()
      }
    })()
  }

  throw new Error('unknown stream')
}

export async function * ndjsonParse (source) {
  const matcher = /\r?\n/
  let buffer = ''
  for await (let chunk of source) {
    if (typeof chunk === 'string') {
      chunk = new TextEncoder().encode(chunk)
    }
    buffer += new TextDecoder('utf8').decode(chunk)
    const parts = buffer.split(matcher)
    buffer = parts.pop()
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        yield JSON.parse(parts[i])
      }
    }
  }
  if (buffer) yield JSON.parse(buffer)
}
