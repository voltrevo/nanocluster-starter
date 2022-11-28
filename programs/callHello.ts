import connectServices from "../src/nanocluster/lib/connectServices.ts";
import nt from "../src/nanocluster/nt/mod.ts";

const { hello } = await connectServices("https://example-public.nanocluster.io/rpc", {
  hello: {
    run: nt.fn()(nt.string),
  },
});

console.log(await hello.run());
