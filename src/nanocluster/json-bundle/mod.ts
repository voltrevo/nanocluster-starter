import assert from "../common/assert.ts";
import nt from "../nt/mod.ts";
import nil from "../common/nil.ts";

export const JsonBundleT = nt.object({
  entryPath: nt.string,
  sources: nt.record(nt.string, nt.string),
  missingPaths: nt.array(nt.string),
});

export type JsonBundleT = nt.TypeOf<typeof JsonBundleT>;

export default async function JsonBundle(
  entryPath: string,
): Promise<JsonBundleT> {
  const sources: Record<string, string> = {};
  const pathsSeen: Record<string, true> = {};
  const pathsToProcess: string[] = [];
  const missingPaths: string[] = [];

  const normEntryPath = new URL(entryPath, `file://${Deno.cwd()}/`).pathname;

  pathsSeen[normEntryPath] = true;
  pathsToProcess.push(normEntryPath);

  while (pathsToProcess.length > 0) {
    const path = pathsToProcess.shift();

    if (path === nil) {
      break;
    }

    let source: string;

    try {
      source = await Deno.readTextFile(path);
    } catch (error) {
      if (error.name !== "NotFound") {
        throw error;
      }

      missingPaths.push(path);
      continue;
    }

    sources[path] = source;

    for (const importedPath of ImportedPaths(source)) {
      if (!importedPath.startsWith(".")) {
        continue;
      }

      const normImportedPath: string =
        new URL(importedPath, new URL(`file://${path}`)).pathname;

      if (normImportedPath in pathsSeen) {
        continue;
      }

      pathsSeen[normImportedPath] = true;
      pathsToProcess.push(normImportedPath);
    }
  }

  const bundle = Bundle(normEntryPath, sources, missingPaths);

  return bundle;
}

function ImportedPaths(source: string): string[] {
  let pos = 0;
  const whitespaceChars = " \t\r\n";

  const paths: string[] = [];

  if (source.startsWith("#!")) {
    skipLineComment();
  }

  while (true) {
    const foundImport = findImportKeyword();

    if (!foundImport) {
      break;
    }

    pos += "import ".length;

    const foundSemicolon = findSemicolon();

    if (!foundSemicolon) {
      break;
    }

    const path = findStringBackwards();

    if (path === nil) {
      // Invalid syntax
      return paths;
    }

    paths.push(path);
    pos++; // semicolon
  }

  return paths;

  function findImportKeyword() {
    while (true) {
      if (
        source.slice(pos, pos + "import".length) === "import" &&
        whitespaceChars.includes(source[pos + "import".length])
      ) {
        return true;
      }

      if (isWhitespace()) {
        skipWhitespace();
        continue;
      }

      if (isLineComment()) {
        skipLineComment();
        continue;
      }

      if (isBlockComment()) {
        skipBlockComment();
        continue;
      }

      return false;
    }
  }

  function isWhitespace() {
    return whitespaceChars.includes(source[pos]);
  }

  function skipWhitespace() {
    pos++;

    while (isWhitespace()) {
      pos++;
    }
  }

  function isLineComment() {
    return source[pos] === "/" && source[pos + 1] === "/";
  }

  function skipLineComment() {
    pos += 2;

    while (source[pos] !== "\n") {
      pos++;
    }

    pos++;
  }

  function isBlockComment() {
    return source[pos] === "/" && source[pos + 1] === "*";
  }

  function skipBlockComment() {
    pos += 2;

    while (source[pos] !== "*" || source[pos + 1] !== "/") {
      pos++;
    }

    pos += 2;
  }

  function findSemicolon() {
    while (true) {
      if (source[pos] === ";") {
        return true;
      }

      if (source[pos] === nil) {
        return false;
      }

      if (['"', "'"].includes(source[pos])) {
        const quote = source[pos];
        pos++;

        while (true) {
          if (source[pos] === quote) {
            pos++;
            break;
          }

          if (source[pos] === nil) {
            return false;
          }

          if (source[pos] === "\\") {
            pos++;
          }

          pos++;
        }

        continue;
      }

      pos++;
    }
  }

  function findStringBackwards() {
    let p = pos - 1;
    let quote: string;
    let end: number;

    while (true) {
      if (['"', "'"].includes(source[p])) {
        quote = source[p];
        end = p;
        p--;
        break;
      }

      if (source[p] === nil) {
        return nil;
      }

      p--;
    }

    while (true) {
      if (source[p - 1] === "\\") {
        p -= 2;
        continue;
      }

      if (source[p] === quote) {
        return source.slice(p + 1, end);
      }

      if (source[p] === nil) {
        return nil;
      }

      p--;
    }
  }
}

function Bundle(
  entryPath: string,
  sources: Record<string, string>,
  missingPaths: string[],
) {
  const paths = Object.keys(sources);
  const sharedDirs = entryPath.split("/");
  sharedDirs.pop(); // Last element is the filename

  for (const path of paths) {
    while (!path.startsWith(`${sharedDirs.join("/")}/`)) {
      assert(sharedDirs.length > 0);
      sharedDirs.pop();
    }
  }

  const removeLen = sharedDirs.join("/").length;

  const normSources: Record<string, string> = {};

  for (const [path, source] of Object.entries(sources)) {
    normSources[path.slice(removeLen)] = source;
  }

  return {
    entryPath: entryPath.slice(removeLen),
    sources: normSources,
    missingPaths: missingPaths.map((mp) => mp.slice(removeLen)),
  };
}
