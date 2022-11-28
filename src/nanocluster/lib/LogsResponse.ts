import nt from "../nt/mod.ts";
import LogMessage from "./LogMessage.ts";

const LogResponse = nt.object({
  messages: nt.array(LogMessage),
  unavailableCount: nt.number,
});

type LogResponse = nt.TypeOf<typeof LogResponse>;

export default LogResponse;
