import toBuffer from "./toBuffer.ts";

export default function equalAsBuffers(a: unknown, b: unknown) {
  const [bufA, bufB] = [a, b].map(toBuffer);

  const len = bufA.length;

  if (bufB.length !== len) {
    return false;
  }

  for (let i = 0; i < len; i++) {
    if (bufA[i] !== bufB[i]) {
      return false;
    }
  }

  return true;
}
