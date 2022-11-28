import nt from "../nt/mod.ts";

const MemoryUsage = nt.object({
  rss: nt.number,
  heapTotal: nt.number,
  heapUsed: nt.number,
  external: nt.number,
});

const StatusResponse = nt.object({
  startTime: nt.number,
  services: nt.number,
  requests: nt.object({
    total: nt.number,
    processing: nt.number,
    rate: nt.number,
  }),
  pid: nt.number,
  memoryUsage: MemoryUsage,
});

type StatusResponse = nt.TypeOf<typeof StatusResponse>;

export default StatusResponse;
