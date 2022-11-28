type Result<T> = { ok: T } | { err: string };

export async function ResultFromPromise<T>(
  promise: Promise<T>,
): Promise<Result<T>> {
  try {
    return { ok: await promise };
  } catch (error) {
    return { err: error.message };
  }
}

export default Result;
