import nt from "../nt/mod.ts";
import ServiceMetadata from "./ServiceMetadata.ts";

const ServiceStatus = nt.object({
  src: nt.union(nt.string, nt.nil),
  metadata: nt.union(ServiceMetadata, nt.nil),
  lastUpdate: nt.union(
    nt.nil,
    nt.object({
      time: nt.number,
      type: nt.union(
        nt.literal("deployed"),
        nt.literal("upgraded"),
      ),
    }),
  ),
  workers: nt.number,
  requests: nt.object({
    total: nt.number,
    processing: nt.number,
    rate: nt.object({
      value: nt.number,
      time: nt.number,
      unitDuration: nt.number,
      decayDuration: nt.number,
    }),
  }),
  drains: nt.array(nt.object({
    src: nt.string,
    workers: nt.number,
    pendingCount: nt.number,
  })),
});

type ServiceStatus = nt.TypeOf<typeof ServiceStatus>;

export default ServiceStatus;
