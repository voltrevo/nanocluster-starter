import { pack } from "https://deno.land/x/msgpackr@v1.8.0/pack.js";

export default function toBuffer(value: unknown): Uint8Array {
  return pack(value);
}
