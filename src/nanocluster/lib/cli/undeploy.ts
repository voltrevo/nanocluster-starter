import nil from "../../common/nil.ts";
import { ClusterApi } from "../../nanocluster-lib/ClusterProtocol.ts";

export default async function undeploy(
  cluster: ClusterApi,
  service?: string,
) {
  if (service === nil) {
    console.error("Usage: nnc undeploy <service>");
    Deno.exit(1);
  }

  try {
    console.log(
      await cluster.undeploy(service),
    );
  } catch (error) {
    console.error(error.message);
    Deno.exit(1);
  }
}
