// This file is derived from https://github.com/cryptocoinjs/base-x/blob/51a5bca/src/index.js. I am
// not certain that I am obliged to propagate its MIT license, but I am doing so to be safe.
//
// If the work linked above becomes part of the public domain, please notify me so that I can commit
// this work to the public domain also.
//
// If you intend your software to be freely available, please consider unlicense.org to avoid this
// confusion.
//
// This file is licensed as follows:
//
//   The MIT License (MIT)
//
//   Copyright (c) 2018 base-x contributors Copyright (c) 2014-2018 The Bitcoin Core developers
//
//   Permission is hereby granted, free of charge, to any person obtaining a copy of this software
//   and associated documentation files (the "Software"), to deal in the Software without
//   restriction, including without limitation the rights to use, copy, modify, merge, publish,
//   distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
//   Software is furnished to do so, subject to the following conditions:
//
//   The above copyright notice and this permission notice shall be included in all copies or
//   substantial portions of the Software.
//
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
//   BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
//   DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

export default function basex(ALPHABET: string) {
  if (ALPHABET.length >= 255) {
    throw new TypeError("Alphabet too long");
  }

  const BASE_MAP = new Uint8Array(256);

  for (let j = 0; j < BASE_MAP.length; j++) {
    BASE_MAP[j] = 255;
  }

  for (let i = 0; i < ALPHABET.length; i++) {
    const x = ALPHABET.charAt(i);
    const xc = x.charCodeAt(0);

    if (BASE_MAP[xc] !== 255) {
      throw new TypeError(`${x} is ambiguous`);
    }

    BASE_MAP[xc] = i;
  }

  const BASE = ALPHABET.length;
  const LEADER = ALPHABET.charAt(0);
  const FACTOR = Math.log(BASE) / Math.log(256); // log(BASE) / log(256), rounded up
  const iFACTOR = Math.log(256) / Math.log(BASE); // log(256) / log(BASE), rounded up

  function encode(buf: ArrayBuffer) {
    const source = new Uint8Array(buf);

    if (source.length === 0) {
      return "";
    }

    // Skip & count leading zeroes.
    let zeroes = 0;
    let length = 0;
    let pbegin = 0;
    const pend = source.length;

    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++;
      zeroes++;
    }

    // Allocate enough space in big-endian base58 representation.
    const size = ((pend - pbegin) * iFACTOR + 1) >>> 0;
    const b58 = new Uint8Array(size);

    // Process the bytes.
    while (pbegin !== pend) {
      let carry = source[pbegin];
      // Apply "b58 = b58 * 256 + ch".
      let i = 0;

      for (
        let it1 = size - 1;
        (carry !== 0 || i < length) && (it1 !== -1);
        it1--, i++
      ) {
        carry += (256 * b58[it1]) >>> 0;
        b58[it1] = (carry % BASE) >>> 0;
        carry = (carry / BASE) >>> 0;
      }

      if (carry !== 0) {
        throw new Error("Non-zero carry");
      }

      length = i;
      pbegin++;
    }

    // Skip leading zeroes in base58 result.
    let it2 = size - length;
    while (it2 !== size && b58[it2] === 0) {
      it2++;
    }

    // Translate the result into a string.
    let str = LEADER.repeat(zeroes);
    for (; it2 < size; ++it2) str += ALPHABET.charAt(b58[it2]);
    return str;
  }

  function decode(source: string): ArrayBuffer {
    if (source.length === 0) {
      return new ArrayBuffer(0);
    }

    let psz = 0;

    // Skip leading spaces.
    if (source[psz] === " ") {
      throw new Error("Unexpected leading space");
    }

    // Skip and count leading '1's.
    let zeroes = 0;
    let length = 0;

    while (source[psz] === LEADER) {
      zeroes++;
      psz++;
    }

    // Allocate enough space in big-endian base256 representation.
    const size = (((source.length - psz) * FACTOR) + 1) >>> 0; // log(58) / log(256), rounded up.
    const b256 = new Uint8Array(size);

    // Process the characters.
    while (source[psz]) {
      // Decode character
      let carry = BASE_MAP[source.charCodeAt(psz)];

      if (carry === 255) {
        throw new Error("Invalid character");
      }

      let i = 0;
      for (
        let it3 = size - 1;
        (carry !== 0 || i < length) && (it3 !== -1);
        it3--, i++
      ) {
        carry += (BASE * b256[it3]) >>> 0;
        b256[it3] = (carry % 256) >>> 0;
        carry = (carry / 256) >>> 0;
      }

      if (carry !== 0) {
        throw new Error("Non-zero carry");
      }

      length = i;
      psz++;
    }

    if (source[psz] === " ") {
      throw new Error("Unexpected trailing space");
    }

    // Skip leading zeroes in b256.
    let it4 = size - length;
    while (it4 !== size && b256[it4] === 0) {
      it4++;
    }

    const buf = new ArrayBuffer(zeroes + (size - it4));
    const vch = new Uint8Array(buf);

    let j = zeroes;
    while (it4 !== size) {
      vch[j++] = b256[it4++];
    }

    return vch;
  }

  return { encode, decode };
}
