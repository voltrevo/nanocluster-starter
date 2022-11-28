#!/usr/bin/env deno run --allow-read --allow-net --allow-run --allow-env

import ensureType from "../src/nanocluster/common/ensureType.ts";
import nil from "../src/nanocluster/common/nil.ts";
import RpcOverFetch from "../src/nanocluster/comms/RpcOverFetch.ts";
import UsernamePasswordAuth from "../src/nanocluster/comms/UsernamePasswordAuth.ts";
import cli from "../src/nanocluster/lib/cli/index.ts";
import ClusterProtocol from "../src/nanocluster/lib/ClusterProtocol.ts";
import nt from "../src/nanocluster/nt/mod.ts";

const Config = nt.object({
  rpc: nt.string,
  auth: nt.union(
    nt.nil,
    nt.object({
      username: nt.string,
      password: nt.string,
    }),
  ),
});

type Config = nt.TypeOf<typeof Config>;

let configTxt;

try {
  configTxt = await Deno.readTextFile(
    `${Deno.env.get("HOME")}/.nnc/config.json`,
  );
} catch (error) {
  if (!(error instanceof Deno.errors.NotFound)) {
    throw error;
  }

  console.error("~/.nnc/config.json not found");

  console.error(
    "It should look like this:",
    JSON.stringify(
      ensureType<Config>()({
        rpc: "https://example.nanocluster.io/rpc",
        auth: {
          username: "jane.doe",
          password: "(strong password)",
        },
      }),
      null,
      2,
    ),
  );

  Deno.exit(1);
}

const config = JSON.parse(configTxt);

nt.assert(config, Config);

await cli(
  RpcOverFetch(
    config.rpc,
    ClusterProtocol,
    {
      authorize: config.auth === nil ? nil : UsernamePasswordAuth(
        config.auth.username,
        config.auth.password,
      ),
    },
  ),
  ...Deno.args,
);
