import nil from "../../common/nil.ts";
import { ClusterApi } from "../../lib/ClusterProtocol.ts";
import Parser, { ServiceCall } from "./Parser.ts";

export function parse(...args: string[]): ServiceCall | nil {
  if (args.length !== 1 || !args[0]) {
    return nil;
  }

  return new Parser(args[0]).ServiceCall();
}

export async function call(
  cluster: ClusterApi,
  { service, method, args }: ServiceCall,
) {
  try {
    console.log(await cluster.call(service, { method, args }));
  } catch (error) {
    console.error(error.message);
    Deno.exit(1);
  }
}
