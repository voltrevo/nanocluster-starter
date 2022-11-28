import nt from "../nt/mod.ts";
import { Keccak256 } from "./deps.ts";
import toBuffer from "./toBuffer.ts";
import equalAsBuffers from "./equalAsBuffers.ts";

export const UsernamePasswordAuthData = nt.object({
  username: nt.string,
  validUntil: nt.number,
  sig: nt.buffer,
});

export type UsernamePasswordAuthData = nt.TypeOf<
  typeof UsernamePasswordAuthData
>;

export default function UsernamePasswordAuth(
  username: string,
  password: string,
) {
  return (id: string, callBuf: Uint8Array): UsernamePasswordAuthData => {
    const validUntil = Date.now() + 15000;

    const sig = new Uint8Array(
      new Keccak256()
        .update(toBuffer({
          username,
          password,
          id,
          callBuf,
          validUntil,
        }))
        .digest(),
    );

    return {
      username,
      validUntil,
      sig,
    };
  };
}

export async function checkUsernamePasswordAuth(
  request: {
    id: string;
    auth: unknown;
    callBuf: Uint8Array;
  },
  getPassword: (username: string) => Promise<string>,
) {
  nt.assert(request.auth, UsernamePasswordAuthData);

  if (request.auth.validUntil > Date.now() + 20000) {
    throw new Error("validUntil is too far in the future");
  }

  if (Date.now() > request.auth.validUntil) {
    throw new Error("no longer valid (passed validUntil)");
  }

  const password = await getPassword(request.auth.username);

  const expectedSig = new Uint8Array(
    new Keccak256()
      .update(toBuffer({
        username: request.auth.username,
        password,
        id: request.id,
        callBuf: request.callBuf,
        validUntil: request.auth.validUntil,
      }))
      .digest(),
  );

  if (!equalAsBuffers(request.auth.sig, expectedSig)) {
    throw new Error("Invalid signature");
  }

  return request.auth;
}
