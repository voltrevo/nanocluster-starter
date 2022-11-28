import nt from "../nanocluster/nt/mod.ts";
import NanoService from "../nanocluster/lib/NanoService.ts";

export default NanoService({
  public: true,

  protocol: {
    run: nt.fn()(nt.string),
  },

  peers: {},

  methods: {
    run() {
      return "Hello world!";
    },
  },
});
