import nil from "../nanocluster/common/nil.ts";
import NanoService from "../nanocluster/lib/NanoService.ts";
import nt from "../nanocluster/nt/mod.ts";

export default NanoService({
  protocol: {
    view: nt.fn()(nt.number),
    reset: nt.fn()(nt.nil),
  },

  peers: {},

  methods: {
    async view({ storage }) {
      let value = (await storage.get("value")) ?? 0;
      nt.assert(value, nt.number);
      value++;
      await storage.set("value", value);

      return value;
    },

    async reset({ storage }) {
      await storage.set("value", nil);

      return nil; // TODO: void type?
    },
  },
});
