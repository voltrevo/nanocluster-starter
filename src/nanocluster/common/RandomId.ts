import base58 from "./base58.ts";

export default function RandomId() {
  return base58.encode(crypto.getRandomValues(new Uint8Array(20)));
}
