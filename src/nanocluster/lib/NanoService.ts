import nt from "../nt/mod.ts";

export type CallContext<Peers extends Record<string, Protocol>> = {
  log: {
    debug: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
  peers: {
    [K in keyof Peers]: ApiOf<Peers[K]>;
  };
  storage: {
    get: (key: unknown) => Promise<unknown>;
    set: (key: unknown, value: unknown) => Promise<void>;
  };
};

type AnyFunction = (...args: any[]) => any;

type ValueOrPromise<T> = T | Promise<T>;

type ImplementationOfFn<
  Fn extends AnyFunction,
  Peers extends Record<string, Protocol>,
> = (
  ctx: CallContext<Peers>,
  args: Parameters<Fn>,
) => ValueOrPromise<ReturnType<Fn>>;

type ApiOfFn<Fn extends AnyFunction> = (
  ...args: Parameters<Fn>
) => Promise<ReturnType<Fn>>;

type ImplementationOf<
  P extends Protocol,
  Peers extends Record<string, Protocol>,
> = {
  [K in keyof P]: ImplementationOfFn<nt.TypeOf<P[K]>, Peers>;
};

type ApiOf<
  P extends Protocol,
> = {
  [K in keyof P]: ApiOfFn<nt.TypeOf<P[K]>>;
};

export type NanoApiOf<
  P extends Protocol,
> = ApiOf<P>;

type Protocol = Record<string, nt.NanoType<AnyFunction>>;
export type NanoServiceProtocol = Protocol;

export type NanoServiceDefinition = {
  public?: true;
  protocol: Protocol;
  peers: Record<string, Protocol>;
  methods: ImplementationOf<Protocol, Record<string, Protocol>>;
};

export default function NanoService<
  P extends Protocol,
  Peers extends Record<string, Protocol>,
>(
  definition: {
    public?: true;
    protocol: P;
    peers: Peers;
    methods: ImplementationOf<P, Peers>;
  },
) {
  return definition;
}
