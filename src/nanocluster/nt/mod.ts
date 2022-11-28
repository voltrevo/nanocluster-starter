import commonAssert from "../common/assert.ts";

// deno-lint-ignore no-namespace
namespace nt {
  export type Primitive = boolean | number | string;

  type TypeDataList = [
    {
      primitive:
        | "undefined"
        | "null"
        | "boolean"
        | "number"
        | "string";
    },
    { literal: Primitive },
    { array: NanoTypeData },
    { tuple: NanoTypeData[] },
    { object: Record<string, NanoTypeData> },
    { record: { key: NanoTypeData; value: NanoTypeData } },
    { union: NanoTypeData[] },
    { unknown: [] },
    { fn: { args: NanoTypeData[]; ret: NanoTypeData } },
    { buffer: [] },
  ];

  export type NanoTypeData = UnionOfList<TypeDataList>;
  type TypeDataMap = IntersectionOfList<TypeDataList>;
  export type NanoTypeCategory = keyof TypeDataMap;

  export class NanoType<T> {
    #T!: (value: T) => T;

    constructor(public data: NanoTypeData) {}
  }

  export type AnyNanoType = NanoType<any>;

  export const boolean = new NanoType<boolean>({ primitive: "boolean" });
  export const number = new NanoType<number>({ primitive: "number" });
  export const string = new NanoType<string>({ primitive: "string" });

  export function array<T>(element: NanoType<T>) {
    return new NanoType<T[]>({ array: element.data });
  }

  export function literal<T extends Primitive>(
    value: T,
  ) {
    return new NanoType<T>({ literal: value });
  }

  export const buffer = new NanoType<Uint8Array>({ buffer: [] });

  export const undefined_ = new NanoType<undefined>({ primitive: "undefined" });
  export const nil = undefined_;
  export const null_ = new NanoType<null>({ primitive: "null" });
  export const unknown = new NanoType<unknown>({ unknown: [] });

  export function tuple<Elements extends AnyNanoType[]>(
    ...elements: Elements
  ) {
    return new NanoType<UnwrapTypes<Elements>>({
      tuple: elements.map((e) => e.data),
    });
  }

  export function object<TypesObject extends Record<string, AnyNanoType>>(
    typesObject: TypesObject,
  ) {
    return new NanoType<
      {
        [K in keyof TypesObject]: TypeOf<TypesObject[K]>;
      }
    >({
      object: mapValues(typesObject, (t) => t.data),
    });
  }

  export function record<
    K extends AnyNanoType,
    V extends AnyNanoType,
  >(
    key: K,
    value: V,
  ) {
    return new NanoType<Record<TypeOf<K>, TypeOf<V>>>({
      record: { key: key.data, value: value.data },
    });
  }

  export function union<Options extends AnyNanoType[]>(
    ...options: Options
  ) {
    return new NanoType<UnionOfList<UnwrapTypes<Options>>>({
      union: options.map((o) => o.data),
    });
  }

  export function fn<Args extends AnyNanoType[]>(...args: Args) {
    return <Ret extends AnyNanoType>(ret: Ret) => {
      return new NanoType<(...args: UnwrapTypes<Args>) => TypeOf<Ret>>({
        fn: { args: args.map((a) => a.data), ret: ret.data },
      });
    };
  }

  export function check<NT extends AnyNanoType>(
    value: unknown,
    Type: NT,
  ): value is TypeOf<NT> {
    return checkImpl(value, Type.data);
  }

  export function assert<NT extends AnyNanoType>(
    value: unknown,
    Type: NT,
  ): asserts value is TypeOf<NT> {
    commonAssert(
      check(value, Type),
      `${JSON.stringify(value)} is not a ${toString(Type)}`,
    );
  }

  export function checkAssignable(Target: AnyNanoType, Source: AnyNanoType) {
    return checkAssignableImpl(Target.data, Source.data);
  }

  export function assertAssignable(Target: AnyNanoType, Source: AnyNanoType) {
    commonAssert(
      checkAssignable(Target, Source),
      `${toString(Target)} cannot accept assignment from ${toString(Source)}`,
    );
  }

  export function toString(Type: AnyNanoType) {
    return toStringImpl(Type.data);
  }

  function checkImpl<TD extends NanoTypeData>(
    value: unknown,
    typeData: TD,
  ): boolean {
    return applyVisitor(typeData, {
      primitive: (typename) => (
        (typeof value === typename) ||
        (value === null && typename === "null")
      ),

      literal: (v) => value === v,

      array: (element) =>
        Array.isArray(value) &&
        value.every((v) => checkImpl(v, element)),

      tuple: (elements) => (
        Array.isArray(value) &&
        // For now we are strict about length because this is what TypeScript
        // does. However, it's possible to allow extra values than the tuple
        // requires to make compatibility easier.
        value.length === elements.length &&
        elements.every((t, i) => checkImpl(value[i], t))
      ),

      object: (typesObject) => {
        if (typeof value !== "object" || value === null) {
          return false;
        }

        for (const k of Object.keys(typesObject)) {
          if (
            !checkImpl(
              (value as Record<string, unknown>)[k],
              typesObject[k],
            )
          ) {
            return false;
          }
        }

        return true;
      },

      record: ({ key, value: recordValue }) => {
        if (typeof value !== "object" || value === null) {
          return false;
        }

        for (const [k, v] of Object.entries(value)) {
          if (!checkImpl(k, key) || !checkImpl(v, recordValue)) {
            return false;
          }
        }

        return true;
      },

      union: (options) => options.some((o) => checkImpl(value, o)),

      unknown: () => true,

      fn: ({ args, ret }) => {
        if (typeof value !== "function") {
          return false;
        }

        throw new Error(
          `Unable to determine whether function is a ${
            toStringImpl({ fn: { args, ret } })
          }`,
        );
      },

      buffer: () => value instanceof Uint8Array,
    });
  }

  function checkAssignableImpl(
    targetData: NanoTypeData,
    sourceData: NanoTypeData,
  ): boolean {
    const handleSourceUnion = (sourceOptions: NanoTypeData[]) =>
      sourceOptions.every((op) => checkAssignableImpl(targetData, op));

    return applyVisitor(targetData, {
      primitive: (targetTypename) =>
        applyVisitor(sourceData, {
          primitive: (sourceTypename) => sourceTypename === targetTypename,
          literal: (sourceValue) =>
            typeof sourceValue === targetTypename ||
            (sourceValue === null && targetTypename === "null"),
          array: () => false,
          tuple: () => false,
          object: () => false,
          record: () => false,
          union: handleSourceUnion,
          unknown: () => false,
          fn: () => false,
          buffer: () => false,
        }),
      literal: (targetValue) =>
        applyVisitor(sourceData, {
          primitive: () => false,
          literal: (sourceValue) => sourceValue === targetValue,
          array: () => false,
          tuple: () => false,
          object: () => false,
          record: () => false,
          union: handleSourceUnion,
          unknown: () => false,
          fn: () => false,
          buffer: () => false,
        }),
      array: (targetElement) =>
        applyVisitor(sourceData, {
          primitive: () => false,
          literal: () => false,
          array: (sourceElement) =>
            checkAssignableImpl(targetElement, sourceElement),
          tuple: (sourceElements) =>
            sourceElements.every((sel) =>
              checkAssignableImpl(targetElement, sel)
            ),
          object: () => false,
          record: () => false,
          union: handleSourceUnion,
          unknown: () => false,
          fn: () => false,
          buffer: () => false,
        }),
      tuple: (targetElements) =>
        applyVisitor(sourceData, {
          primitive: () => false,
          literal: () => false,
          array: () => false,
          tuple: (sourceElements) =>
            sourceElements.length === targetElements.length &&
            targetElements.every((tel, i) =>
              checkAssignableImpl(tel, sourceElements[i])
            ),
          object: () => false,
          record: () => false,
          union: handleSourceUnion,
          unknown: () => false,
          fn: () => false,
          buffer: () => false,
        }),
      object: (targetTypesObject) =>
        applyVisitor(sourceData, {
          primitive: () => false,
          literal: () => false,
          array: () => false,
          tuple: () => false,
          object: (sourceTypesObject) => {
            for (
              const [targetKey, targetType] of Object.entries(targetTypesObject)
            ) {
              if (!(targetKey in sourceTypesObject)) {
                return false;
              }

              if (
                !checkAssignableImpl(targetType, sourceTypesObject[targetKey])
              ) {
                return false;
              }
            }

            return true;
          },
          record: ({ key: sourceKey, value: sourceValue }) => {
            function gatherExactKeys(td: NanoTypeData): string[] {
              if ("literal" in td) {
                return typeof td.literal === "string" ? [td.literal] : [];
              }

              if ("union" in td) {
                const res: string[] = [];

                for (const option of td.union) {
                  res.push(...gatherExactKeys(option));
                }

                return res;
              }

              return [];
            }

            const exactSourceKeys = gatherExactKeys(sourceKey);

            for (
              const [targetKey, targetValue] of Object.entries(
                targetTypesObject,
              )
            ) {
              if (!exactSourceKeys.includes(targetKey)) {
                return false;
              }

              if (!checkAssignableImpl(targetValue, sourceValue)) {
                return false;
              }
            }

            return true;
          },
          union: handleSourceUnion,
          unknown: () => false,
          fn: () => false,
          buffer: () => false,
        }),
      record: ({ key: targetKey, value: targetValue }) =>
        applyVisitor(sourceData, {
          primitive: () => false,
          literal: () => false,
          array: () => false,
          tuple: () => false,
          object: () => {
            throw new Error("TODO");
          },
          record: () => {
            throw new Error("TODO");
          },
          union: handleSourceUnion,
          unknown: () => false,
          fn: () => false,
          buffer: () => false,
        }),
      union: (targetOptions) =>
        targetOptions.some((to) => checkAssignableImpl(to, sourceData)),
      unknown: () => true,
      fn: ({ args: targetArgs, ret: targetRet }) =>
        applyVisitor(sourceData, {
          primitive: () => false,
          literal: () => false,
          array: () => false,
          tuple: () => false,
          object: () => false,
          record: () => false,
          union: handleSourceUnion,
          unknown: () => false,
          fn: ({ args: sourceArgs, ret: sourceRet }) => {
            if (sourceArgs.length !== targetArgs.length) {
              return false;
            }

            // Assignability is backwards for arguments. This is an
            // important subtlety and not a mistake:
            //
            // const src: string = "str";
            // const dst: string | number = src; // ok
            //
            // const src: (x: string) => string = x => x.toUpperCase();
            // const dst: (x: string | number) => string = src; // not ok
            // dst(37); // because of this
            //
            if (
              !targetArgs.every((ta, i) =>
                checkAssignableImpl(sourceArgs[i], ta)
              )
            ) {
              return false;
            }

            return checkAssignableImpl(targetRet, sourceRet);
          },
          buffer: () => false,
        }),
      buffer: () =>
        applyVisitor(sourceData, {
          primitive: () => false,
          literal: () => false,
          array: () => false,
          tuple: () => false,
          object: () => false,
          record: () => false,
          union: handleSourceUnion,
          unknown: () => false,
          fn: () => false,
          buffer: () => true,
        }),
    });
  }

  function toStringImpl(typeData: NanoTypeData): string {
    return applyVisitor(typeData, {
      primitive: (typename) => typename,
      literal: (value) => value.toString(),
      array: (element) => {
        let elementStr = toStringImpl(element);

        if ("union" in element || "intersection" in element) {
          elementStr = `(${elementStr})`;
        }

        return `${elementStr}[]`;
      },
      tuple: (elements) => `[${elements.map(toStringImpl).join(", ")}]`,
      object: (typesObject) => {
        const keys = Object.keys(typesObject);

        if (keys.length === 0) {
          return "{}";
        }

        return `{ ${
          keys
            .map((k) => `${k}: ${toStringImpl(typesObject[k])}`)
            .join(", ")
        } }`;
      },
      record: ({ key, value }) =>
        `Record<${toStringImpl(key)}, ${toStringImpl(value)}>`,
      union: (options) => {
        if (options.length === 0) {
          return "never";
        }

        return options.map(toStringImpl).join(" | ");
      },
      unknown: () => "unknown",
      fn: ({ args, ret }) =>
        `(${args.map(toStringImpl).join(", ")}) => ${toStringImpl(ret)}`,
      buffer: () => "buffer",
    });
  }

  export type TypeOf<NT extends AnyNanoType> = NT extends NanoType<infer T> ? T
    : never;

  type UnionOfList<L> = L extends [infer Head, ...infer Tail]
    ? Head | UnionOfList<Tail>
    : never;

  type IntersectionOfList<L> = CondenseMap<IntersectionOfListImpl<L>>;

  type CondenseMap<M> = {
    [K in keyof M]: M[K];
  };

  type IntersectionOfListImpl<L> = L extends [infer Head, ...infer Tail]
    ? Head & IntersectionOfListImpl<Tail>
    : unknown;

  type UnwrapTypes<Types extends AnyNanoType[]> = UnwrapTypesImpl<Types>;

  type UnwrapTypesImpl<Types> = Types extends
    [NanoType<infer Head>, ...infer Tail] ? [Head, ...UnwrapTypesImpl<Tail>]
    : [];

  function mapValues<Obj extends Record<string, unknown>, MapT>(
    obj: Obj,
    map: (value: Obj[keyof Obj]) => MapT,
  ) {
    const mappedObj = {} as {
      [K in keyof Obj]: MapT;
    };

    for (const k of Object.keys(obj)) {
      mappedObj[k as keyof Obj] = map(obj[k as keyof Obj]);
    }

    return mappedObj;
  }

  type Visitor<T> = {
    [C in NanoTypeCategory]: (categoryData: TypeDataMap[C]) => T;
  };

  function applyVisitor<T>(typeData: NanoTypeData, visitor: Visitor<T>): T {
    const [[c, value]] = Object.entries(typeData);
    return visitor[c as NanoTypeCategory](value);
  }
}

export default nt;
