import assert from "../common/assert.ts";
import ensureType from "../common/ensureType.ts";
import nil from "../common/nil.ts";
import nt from "../nt/mod.ts";

// deno-lint-ignore no-namespace
namespace proto {
  export type AnyFunction = (...args: any[]) => any;

  export type ValueOrPromise<T> = T | Promise<T>;

  export type ApiOfFn<Fn extends AnyFunction> = (
    ...args: Parameters<Fn>
  ) => Promise<ReturnType<Fn>>;

  export type ApiOf<
    P extends Protocol,
  > = {
    [K in keyof P]: ApiOfFn<nt.TypeOf<P[K]>>;
  };

  export type ImplementationOfFn<
    Ctx,
    Fn extends AnyFunction,
  > = (ctx: Ctx, args: Parameters<Fn>) => ValueOrPromise<ReturnType<Fn>>;

  export type ImplementationOf<Ctx, P extends Protocol> = {
    [K in keyof P]: ImplementationOfFn<Ctx, nt.TypeOf<P[K]>>;
  };

  export type Protocol = Record<string, nt.NanoType<AnyFunction>>;

  export const Protocol = ensureType<Protocol>();

  export const implement =
    <Ctx>() =>
    <P extends Protocol>(protocol: P, impl: ImplementationOf<Ctx, P>) => ({
      call: async <M extends string & keyof P>(
        method: M,
        ctx: Ctx,
        args: Parameters<nt.TypeOf<P[M]>>,
      ) => {
        return await impl[method](ctx, args);
      },

      callChecked: async (method: string, ctx: Ctx, args: unknown[]) => {
        const Method = protocol[method];
        assert(Method !== nil, `Method ${method} does not exist`);

        const methodData = Method.data as {
          fn: { args: nt.NanoTypeData[]; ret: nt.NanoTypeData };
        };

        const Args = new nt.NanoType({ tuple: methodData.fn.args });

        nt.assert(args, Args);

        return await impl[method](ctx, args as any);
      },

      callUnchecked: async (method: string, ctx: Ctx, args: unknown[]) => {
        return await impl[method](ctx, args as any);
      },
    });
}

export default proto;
