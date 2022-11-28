import nt from "../nt/mod.ts";

const ServiceMetadata = nt.object({
  public: nt.union(nt.undefined_, nt.literal(true)),
  protocol: nt.record(nt.string, nt.unknown),
  peers: nt.record(nt.string, nt.record(nt.string, nt.unknown)),
});

type ServiceMetadata = nt.TypeOf<typeof ServiceMetadata>;

export default ServiceMetadata;
