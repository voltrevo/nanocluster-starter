import { unpack } from "https://deno.land/x/msgpackr@v1.8.0/unpack.js";

export default function fromBuffer(buf: Uint8Array): unknown {
  return unpack(buf);
}
