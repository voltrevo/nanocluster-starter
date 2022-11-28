import mapValues from "../common/mapValues.ts";
import RpcOverFetch from "../comms/RpcOverFetch.ts";
import ClusterPublicProtocol from "./ClusterProtocolPublic.ts";
import { NanoApiOf, NanoServiceProtocol } from "./NanoService.ts";

export default async function connectServices<
  Services extends Record<string, NanoServiceProtocol>,
>(
  url: string,
  services: Services,
) {
  const cluster = RpcOverFetch(url, ClusterPublicProtocol);

  const errors = await cluster.checkConnectServices(
    mapValues(services, ProtocolData),
  );

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return mapValues(
    services,
    (proto, serviceName) =>
      mapValues(
        proto,
        (_Fn, method) => (...args: unknown[]) =>
          cluster.call(serviceName, { method, args }),
      ),
  ) as {
    [K in keyof Services]: NanoApiOf<Services[K]>;
  };
}

function ProtocolData(protocol: NanoServiceProtocol) {
  return mapValues(protocol, (fn) => fn.data);
}
