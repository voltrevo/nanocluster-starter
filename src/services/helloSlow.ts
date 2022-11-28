import nt from "../nanocluster/nt/mod.ts";
import delay from "../nanocluster/common/delay.ts";
import NanoService from "../nanocluster/lib/NanoService.ts";

export default NanoService({
  protocol: {
    run: nt.fn()(nt.string),
  },

  peers: {},

  methods: {
    async run({ log }) {
      const waitTime = Math.round(9000 + 2000 * Math.random());
      log.info("Waiting", waitTime, "ms");
      await delay(waitTime);

      return "Hello world";
    },
  },
});
