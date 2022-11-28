import nil from "../../common/nil.ts";
import deploy from "./deploy.ts";
import status from "./status.ts";
import * as cliCalls from "./cliCalls.ts";
import undeploy from "./undeploy.ts";
import { ClusterApi } from "../ClusterProtocol.ts";

const subprograms: Record<
  string,
  | ((cluster: ClusterApi, ...args: string[]) => unknown)
  | nil
> = {
  deploy,
  undeploy,
  status,
};

export default async function cli(
  cluster: ClusterApi,
  ...args: string[]
) {
  const callData = cliCalls.parse(...args);

  if (callData) {
    return await cliCalls.call(cluster, callData);
  }

  const subprogram = args[0] && subprograms[args[0]];

  if (!subprogram) {
    console.error(
      `Usage: nnc <${Object.keys(subprograms).join("|")}|service.method(...)>`,
    );

    Deno.exit(1);
  }

  return await subprogram(cluster, ...args.slice(1));
}
