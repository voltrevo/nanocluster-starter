#!/usr/bin/env deno run --allow-read --allow-run --allow-net

import { Keccak256 } from "https://deno.land/std@0.158.0/hash/sha3.ts";
import { Mutex } from "https://deno.land/x/semaphore@v1.1.1/mutex.ts";

import shell from "https://raw.githubusercontent.com/voltrevo/monorepo/bc4b0c9/projects/shell/mod.ts";

import assert from "../../common/assert.ts";
import base58 from "../../common/base58.ts";
import nil from "../../common/nil.ts";
import toBuffer from "../../comms/toBuffer.ts";
import JsonBundle from "../../json-bundle/mod.ts";
import { ClusterApi } from "../ClusterProtocol.ts";
import FileWatcher from "../FileWatcher.ts";

export default function watchDeploy(
  cluster: ClusterApi,
  serviceParam?: string,
  entryPathParam?: string,
) {
  if (serviceParam === nil || entryPathParam === nil) {
    console.error("Usage: nnc deploy [-w] <service> <src>");
    Deno.exit(1);
  }

  const service = serviceParam;
  const entryPath = entryPathParam;

  const normEntryPath = new URL(entryPath, `file://${Deno.cwd()}/`).pathname;

  let id: string | nil = nil;
  let successId: string | nil = nil;
  const watchers: Record<string, FileWatcher> = {};

  const updateMutex = new Mutex();
  let updateQueued = false;

  function handleFsUpdate() {
    if (updateQueued) {
      return;
    }

    updateQueued = true;

    updateMutex.use(async () => {
      updateQueued = false;
      await handleUpdate();
    });
  }

  async function handleUpdate() {
    const bundle = await JsonBundle(entryPath);

    const newId = base58.encode(
      new Keccak256().update(toBuffer(bundle)).digest().slice(0, 20),
    );

    if (newId === id) {
      return;
    }

    id = newId;

    console.clear();

    if (successId !== nil) {
      console.log("Deployed:", successId);
    }

    console.log("Checking:", id);
    let failed = false;

    try {
      await shell.run("deno", "check", normEntryPath);
    } catch {
      failed = true;
    }

    if (!failed) {
      console.log("Deploying:", id);

      try {
        await cluster.deploy(service, bundle, nil);
      } catch (error) {
        console.error(error.message);
        failed = true;
      }

      if (!failed) {
        successId = id;
        console.clear();
        console.log("Deployed:", successId);
      }
    }

    assert(normEntryPath.endsWith(bundle.entryPath));

    const diskPrefix = normEntryPath.slice(
      0,
      normEntryPath.length - bundle.entryPath.length,
    );

    const newDiskPaths = [
      ...Object.keys(bundle.sources),
      ...bundle.missingPaths,
    ]
      .map((p) => `${diskPrefix}${p}`);

    for (const path of Object.keys(watchers)) {
      if (!newDiskPaths.includes(path)) {
        watchers[path].close();
        delete watchers[path];
      }
    }

    for (const newDiskPath of newDiskPaths) {
      if (!(newDiskPath in watchers)) {
        watchers[newDiskPath] = new FileWatcher(newDiskPath);

        (async () => {
          for await (const _event of watchers[newDiskPath]) {
            handleFsUpdate();
          }
        })();
      }
    }
  }

  handleFsUpdate();
}
