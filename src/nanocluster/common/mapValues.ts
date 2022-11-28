export default function mapValues<K extends string, T, MapT>(
  obj: Record<K, T>,
  mapper: (value: T, key: K) => MapT,
) {
  const res = {} as Record<K, MapT>;

  for (const [k, v] of Object.entries(obj)) {
    res[k as K] = mapper(v as T, k as K);
  }

  return res;
}
