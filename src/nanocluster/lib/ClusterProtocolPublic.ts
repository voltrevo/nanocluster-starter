import nt from "../nt/mod.ts";
import proto from "../comms/proto.ts";

const ClusterPublicProtocol = proto.Protocol({
  checkConnectServices: nt.fn(
    nt.record(nt.string, nt.record(nt.string, nt.unknown)),
  )(
    nt.array(nt.string),
  ),
  call: nt.fn(nt.string, nt.unknown)(nt.unknown),
});

type ClusterPublicProtocol = typeof ClusterPublicProtocol;

export type ClusterPublicApi = proto.ApiOf<ClusterPublicProtocol>;

export default ClusterPublicProtocol;
