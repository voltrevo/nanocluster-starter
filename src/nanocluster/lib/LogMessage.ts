import nt from "../nt/mod.ts";

const LogMessage = nt.object({
  level: nt.union(
    nt.literal("debug"),
    nt.literal("info"),
    nt.literal("warn"),
    nt.literal("error"),
  ),
  args: nt.array(nt.unknown),
  requestId: nt.string,
  time: nt.number,
});

type LogMessage = nt.TypeOf<typeof LogMessage>;

export default LogMessage;
