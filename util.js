/* eslint-env browser */
/* global process, Deno */
import { AbortError } from 'drand-client/abort.js'

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

export async function retry (fn, options) {
  options = options || {}
  options.times = options.times || 5
  options.backoff = options.backoff || 1000

  let error
  for (let i = 0; i < options.times; i++) {
    if (options.signal && options.signal.aborted) {
      throw new AbortError()
    }
    try {
      const res = await fn()
      return res
    } catch (err) {
      error = err
    }
    // console.log('retrying in', options.backoff, 'ms...')
    await pause(options.backoff, options)
    options.backoff *= 2
  }
  throw error
}

export async function pause (ms, options) {
  options = options || {}
  if (!options.signal) return new Promise(resolve => setTimeout(resolve, ms))
  if (options.signal.aborted) throw new AbortError()
  return new Promise((resolve, reject) => {
    const timeoutID = setTimeout(() => {
      options.signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timeoutID)
      reject(new AbortError())
    }
    options.signal.addEventListener('abort', onAbort)
  })
}
