# nanocluster-starter

## Invite Only

Nanocluster is a platform for developing and hosting microservices. This repo is about interacting with that platform, and you currently need to be given access for that to work.

If you'd like an invite, there's a few ways you can get in touch:
1. Register your interest at [nanocluster.io](https://nanocluster.io)
2. Send me an email (see my [github profile](https://github.com/voltrevo))
3. [Open an issue](https://github.com/voltrevo/nanocluster-starter/issues/new) on this repo

## Instructions

1. [Fork](https://github.com/voltrevo/nanocluster-starter/fork) this repo
2. Install [deno](https://deno.land)
3. Install `nnc`

```sh
deno install -n nnc --allow-read --allow-net --allow-run --allow-env programs/cli.ts
```

Note: If you'd like to be prompted about system access from `nnc`, you can remove `--allow-*` flags.

4. Create `~/.nnc/config.json` with content like this:

```json
{
  "rpc": "https://example.nanocluster.io/rpc",
  "auth": {
    "username": "jane.doe",
    "password": "(strong password)",
  }
}
```

5. Check your set-up by running `nnc status`, you should get a result like this:

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

6. If you're a VS Code user, install the deno extension (VS Code should prompt you about this)
7. Deploy your first service:

```sh
nnc deploy hello src/services/helloFast.ts
```

Tip: Use the `-w` flag to watch your code and keep your deployment up to date.

8. Make a request to the service:

```
$ nnc 'hello.run()'
Hello world!
```
