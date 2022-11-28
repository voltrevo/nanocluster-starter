import nil from "../../common/nil.ts";
import JsonBundle from "../../json-bundle/mod.ts";
import watchDeploy from "./watchDeploy.ts";
import { ClusterApi } from "../../nanocluster-lib/ClusterProtocol.ts";

export default async function deploy(
  cluster: ClusterApi,
  ...args: (string | nil)[]
) {
  if (args[0] === "-w") {
    return watchDeploy(cluster, args[1], args[2]);
  }

  const [service, src] = args;

  if (service === nil || src === nil) {
    console.error("Usage: nnc deploy [-w] <service> <src>");
    Deno.exit(1);
  }

  try {
    console.log(
      await cluster.deploy(
        service,
        await JsonBundle(src),
        nil,
      ),
    );
  } catch (error) {
    console.error(error.message);
    Deno.exit(1);
  }
}
