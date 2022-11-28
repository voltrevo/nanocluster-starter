# nanocluster-starter

## Invite Only

Nanocluster is a platform for developing and hosting microservices. This repo is about interacting with that platform, and you currently need to be given access for that to work.

If you'd like an invite, there's a few ways you can get in touch:
1. Register your interest at [nanocluster.io](https://nanocluster.io)
2. Send me an email (see my [github profile](https://github.com/voltrevo))
3. [Open an issue](https://github.com/voltrevo/nanocluster-starter/issues/new) on this repo

## Instructions

1. [Fork](https://github.com/voltrevo/nanocluster-starter/fork) this repo
2. Delete the copyright waiver section from this file (unless you want CC0 to apply to your work)
3. Install [deno](https://deno.land)
4. Install `nnc`

```sh
deno install -n nnc --allow-read --allow-net --allow-run --allow-env programs/cli.ts
```

Note: If you'd like to be prompted about system access from `nnc`, you can remove `--allow-*` flags.

5. Create `~/.nnc/config.json` with content like this:

```json
{
  "rpc": "https://example.nanocluster.io/rpc",
  "auth": {
    "username": "jane.doe",
    "password": "(strong password)",
  }
}
```

6. Check your set-up by running `nnc status`, you should get a result like this:

```json
{
  "startTime": 1669591253362,
  "services": 3,
  "requests": {
    "total": 116,
    "processing": 59,
    "rate": 0.000004359156830928442
  },
  "pid": 2791,
  "memoryUsage": {
    "rss": 9400320,
    "heapTotal": 9543680,
    "heapUsed": 8626540,
    "external": 18421904
  }
}
```

7. If you're a VS Code user, install the deno extension (VS Code should prompt you about this)
8. Deploy your first service:

```sh
nnc deploy hello src/services/helloFast.ts
```

Tip: Use the `-w` flag to watch your code and keep your deployment up to date.

9. Call the service:

```
$ nnc 'hello.run()'
Hello world!
```

10. Call the service programmatically:

See `callHello.ts`:

```ts
import connectServices from "../src/nanocluster/lib/connectServices.ts";
import nt from "../src/nanocluster/nt/mod.ts";

const { hello } = await connectServices("https://example-public.nanocluster.io/rpc", {
  hello: {
    run: nt.fn()(nt.string),
  },
});

console.log(await hello.run());
```

Replace `https://example-public.nanocluster.io/rpc` with your public RPC endpoint.

```
$ deno run --allow-net programs/callHello.ts
Hello world!
```

This code can also run in the browser. [Packup](https://deno.land/x/packup@v0.2.2) is a good tool for doing this using deno tooling. Otherwise, `connectServices` is also available using the [`nanocluster` npm module](https://www.npmjs.com/package/nanocluster).

## Copyright Waiver

Unless stated otherwise ([example](./src/nanocluster/common/basex.ts)), copyright and related rights for all material in this repository are waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
