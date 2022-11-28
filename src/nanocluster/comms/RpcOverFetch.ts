import nil from "../common/nil.ts";
import RandomId from "../common/RandomId.ts";
import nt from "../nt/mod.ts";
import ResultType from "../nt/ResultType.ts";
import fromBuffer from "./fromBuffer.ts";
import proto from "./proto.ts";
import toBuffer from "./toBuffer.ts";

export default function RpcOverFetch<P extends proto.Protocol>(
  url: string,
  protocol: P,
  {
    authorize = () => nil,
    fetch = globalThis.fetch,
  }: {
    authorize?: (
      id: string,
      callBuf: Uint8Array,
    ) => unknown;
    fetch?: typeof globalThis.fetch;
  } = {},
): proto.ApiOf<P> {
  const api: Record<string, unknown> = {};

  for (const method of Object.keys(protocol)) {
    api[method] = async (...args: unknown[]) => {
      const id = RandomId();
      const callBuf = toBuffer({ method, args });

      const res = await fetch(url, {
        method: "POST",
        body: toBuffer({
          id,
          callBuf,
          auth: authorize(id, callBuf),
        }),
      });

      const result = fromBuffer(new Uint8Array(await res.arrayBuffer()));

      nt.assert(
        result,
        ResultType(nt.unknown),
      );

      if ("err" in result) {
        throw new Error(result.err);
      }

      return result.ok;
    };
  }

  return api as proto.ApiOf<P>;
}
