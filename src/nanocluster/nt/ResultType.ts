import Result from "../common/Result.ts";
import nt from "./mod.ts";

export default function ResultType<T>(
  Type: nt.NanoType<T>,
): nt.NanoType<Result<T>> {
  return nt.union(
    nt.object({ ok: Type }),
    nt.object({ err: nt.string }),
  );
}
