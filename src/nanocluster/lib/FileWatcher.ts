import assert from "../common/assert.ts";
import nil from "../common/nil.ts";

// FIXME: File watching is a mess.
//
// This currently just wraps `Deno.watchFs` to handle when files don't yet exist
// by watching the directory (or its parent/etc) until the file exists.
//
// It still falls over when you rename a parent directory of an existing file,
// and quite possibly has other weird edge cases, especially when considering
// other platforms. Filesystems just weren't designed to let you watch a
// particular path 😭.

export default class FileWatcher {
  denoWatcher?: Deno.FsWatcher;
  closed = false;
  emitInitialCreate = false;
  #onClose = () => {};
  path: string;

  constructor(path: string) {
    this.path = new URL(path, `file://${Deno.cwd()}/`).pathname;
  }

  close() {
    this.#onClose();
    this.denoWatcher?.close();
    this.closed = true;
  }

  async *[Symbol.asyncIterator]() {
    assert(!this.closed);
    assert(this.denoWatcher === nil, "Already iterating");

    const events = {
      onClose: () => {},
    };

    this.#onClose = () => events.onClose();

    const { watcher, created } = await acquireDenoWatcher(this.path, events);

    if (watcher === nil) {
      return;
    }

    this.denoWatcher = watcher;

    if (created) {
      const event: Deno.FsEvent = {
        kind: "create",
        paths: [this.path],
      };

      // Deno emits flag:null even though its type definition forbids it.
      // Emulating that here.
      (event as any).flag = null;

      yield event;
    }

    yield* watcher;
  }
}

async function acquireDenoWatcher(
  path: string,
  events: { onClose: () => void },
): Promise<{ watcher?: Deno.FsWatcher; created?: true }> {
  path = new URL(path, `file://${Deno.cwd()}/`).pathname;

  try {
    return { watcher: Deno.watchFs(path, { recursive: false }) };
  } catch (error) {
    if (error.name !== "NotFound") {
      throw error;
    }

    const dirParts = path.split("/");

    while (dirParts.at(-1) === "") {
      dirParts.pop();
    }

    dirParts.pop();
    const dir = `${dirParts.join("/")}/`;

    if (dir === path) {
      assert(path === "/");
      throw error;
    }

    const { watcher: dirWatcher } = await acquireDenoWatcher(dir, events);

    if (dirWatcher === nil) {
      return {};
    }

    try {
      const watcher = Deno.watchFs(path, { recursive: false });
      dirWatcher.close();
      return { watcher, created: true };
    } catch (error2) {
      if (error2.name !== "NotFound") {
        throw error;
      }
    }

    let closed = false;

    events.onClose = () => {
      closed = true;
      dirWatcher.close();
    };

    for await (const event of dirWatcher) {
      const desiredPath = path.endsWith("/") ? path.slice(0, -1) : path;

      if (event.kind === "create" && event.paths.includes(desiredPath)) {
        break;
      }
    }

    if (closed) {
      return {};
    }

    const { watcher } = await acquireDenoWatcher(path, events);

    if (watcher === nil) {
      return {};
    }

    return { watcher, created: true };
  }
}
