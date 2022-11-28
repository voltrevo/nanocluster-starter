import nt from "../nanocluster/nt/mod.ts";
import NanoService from "../nanocluster/lib/NanoService.ts";

export default NanoService({
  protocol: {
    echo: nt.fn(nt.unknown)(nt.unknown), // TODO: Variadic functions
    mul: nt.fn(nt.number, nt.number)(nt.number),
    useHello: nt.fn()(nt.string),
    Stack: nt.fn()(nt.string),
  },

  peers: {
    hello: {
      run: nt.fn()(nt.string),
    },
  },

  methods: {
    echo(_ctx, args) {
      return args;
    },

    mul(_ctx, [a, b]) {
      return a * b;
    },

    useHello({ peers: { hello } }) {
      return hello.run();
    },

    Stack({ log }) {
      function one() {
        return two();
      }

      function two() {
        return three();
      }

      function three() {
        const stackLines = new Error().stack!.split("\n");

        const stack = stackLines.slice(1).map((line) =>
          line.trim().replace("at ", "")
        ).join("\n");

        log.info({ stack });

        return stack;
      }

      return one();
    },
  },
});
