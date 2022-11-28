import { ClusterApi } from "../../lib/ClusterProtocol.ts";

export default async function status(cluster: ClusterApi) {
  try {
    const res = await cluster.status();
    console.log(JSON.stringify(res, null, 2));
  } catch (error) {
    console.error(error.message);
    Deno.exit(1);
  }
}
