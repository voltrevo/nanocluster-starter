import { JsonBundleT } from "../json-bundle/mod.ts";
import LogsResponse from "./LogsResponse.ts";
import nt from "../nt/mod.ts";
import StatusResponse from "./StatusResponse.ts";
import proto from "../comms/proto.ts";
import ServiceMetadata from "./ServiceMetadata.ts";
import LogMessage from "./LogMessage.ts";
import ClusterPublicProtocol from "./ClusterProtocolPublic.ts";

const ClusterProtocol = proto.Protocol({
  ...ClusterPublicProtocol,
  deploy: nt.fn(
    nt.string,
    JsonBundleT,
    nt.union(ServiceMetadata, nt.nil),
  )(
    nt.string,
  ),
  undeploy: nt.fn(nt.string)(nt.string),
  status: nt.fn()(StatusResponse),
  log: nt.fn(LogMessage)(nt.nil),
  logs: nt.fn(nt.number)(LogsResponse),
  serviceStorageGet: nt.fn(nt.buffer)(nt.union(nt.buffer, nt.nil)),
  serviceStorageSet: nt.fn(nt.buffer, nt.union(nt.buffer, nt.nil))(nt.nil),
});

type ClusterProtocol = typeof ClusterProtocol;

export type ClusterApi = proto.ApiOf<ClusterProtocol>;

export default ClusterProtocol;
