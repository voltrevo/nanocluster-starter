import nil from "../../common/nil.ts";

export type ServiceCall = {
  service: string;
  method: string;
  args: unknown[];
};

export default class Parser {
  constructor(
    public src: string,
    public pos: number = 0,
  ) {}

  Clone() {
    return new Parser(this.src, this.pos);
  }

  accept(clone: Parser) {
    this.src = clone.src;
    this.pos = clone.pos;
  }

  get() {
    return this.src[this.pos++];
  }

  peek() {
    return this.src[this.pos];
  }

  skipWs() {
    while (this.peek() === " ") {
      this.pos++;
    }
  }

  Identifier(): string | nil {
    const p = this.Clone();

    if (!/^[_a-zA-Z]$/.test(p.get())) {
      return nil;
    }

    while (/^[_0-9a-zA-Z]$/.test(p.peek())) {
      p.pos++;
    }

    const res = this.src.slice(this.pos, p.pos);
    this.accept(p);

    return res;
  }

  exact(str: string) {
    if (this.src.slice(this.pos, this.pos + str.length) === str) {
      this.pos += str.length;
      return str;
    }

    return nil;
  }

  ServiceCall(): ServiceCall | nil {
    const p = this.Clone();

    const service = p.Identifier();

    p.skipWs();
    if (p.exact(".") !== ".") {
      return nil;
    }

    p.skipWs();
    const method = p.Identifier();

    if (service === nil || method === nil) {
      return nil;
    }

    p.skipWs();
    const wrappedArgs = p.commaSeparated(
      "(",
      (p2) => p2.Value(),
      ")",
    );

    if (wrappedArgs === nil) {
      return nil;
    }

    this.accept(p);

    return {
      service,
      method,
      args: wrappedArgs.map((w) => w.value),
    };
  }

  Value(): { value: unknown } | nil {
    const options: ((p: Parser) => { value: unknown } | nil)[] = [
      (p) => p.KeywordValue(),
      (p) => p.Number(),
      (p) => p.String(),
      (p) => p.Array(),
      (p) => p.Object(),
    ];

    for (const option of options) {
      const res = option(this);

      if (res !== nil) {
        return res;
      }
    }

    return nil;
  }

  KeywordValue(): { value: null | nil | boolean } | nil {
    const keywords: [string, null | nil | boolean][] = [
      ["null", null],
      ["undefined", undefined],
      ["true", true],
      ["false", false],
    ];

    for (const [keyword, value] of keywords) {
      if (this.exact(keyword) === keyword) {
        return { value };
      }
    }

    return nil;
  }

  Number(): { value: number } | nil {
    const matchResult = this.src.slice(this.pos).match(
      /^[\+\-]?\d*\.?\d+(?:[Ee][\+\-]?\d+)?/,
    );

    if (matchResult === null) {
      return nil;
    }

    this.pos += matchResult[0].length;

    return { value: Number(matchResult[0]) };
  }

  String(): { value: string } | nil {
    const p = this.Clone();
    const quote = p.get();

    if (!['"', "'"].includes(quote)) {
      return nil;
    }

    while (p.peek() !== nil) {
      if (p.peek() === "\\") {
        p.pos += 2;
        continue;
      }

      if (p.peek() === quote) {
        break;
      }

      p.pos++;
    }

    if (p.get() !== quote) {
      return nil;
    }

    const startPos = this.pos;
    this.pos = p.pos;

    return { value: JSON.parse(this.src.slice(startPos, this.pos)) };
  }

  Array(): { value: unknown[] } | nil {
    const wrappedValues = this.commaSeparated(
      "[",
      (p) => p.Value(),
      "]",
    );

    if (wrappedValues === nil) {
      return nil;
    }

    return {
      value: wrappedValues.map((w) => w.value),
    };
  }

  Object(): { value: unknown } | nil {
    const entries = this.commaSeparated(
      "{",
      (p): [string, unknown] | nil => {
        const key = p.Identifier();

        if (key === nil) {
          return nil;
        }

        p.skipWs();
        if (p.exact(":") !== ":") {
          return nil;
        }

        p.skipWs();
        const wrappedValue = p.Value();

        if (wrappedValue === nil) {
          return nil;
        }

        return [key, wrappedValue.value];
      },
      "}",
    );

    if (entries === nil) {
      return nil;
    }

    return {
      value: Object.fromEntries(entries),
    };
  }

  commaSeparated<T>(
    startChar: string,
    parseElement: (p: Parser) => T | nil,
    endChar: string,
  ): T[] | nil {
    const p = this.Clone();

    if (p.exact(startChar) !== startChar) {
      return nil;
    }

    const elements: T[] = [];
    p.skipWs();
    const firstElement = parseElement(p);

    if (firstElement !== nil) {
      elements.push(firstElement);

      while (true) {
        p.skipWs();
        if (p.exact(",") !== ",") {
          break;
        }

        p.skipWs();
        const element = parseElement(p);

        if (element === nil) {
          return nil;
        }

        elements.push(element);
      }
    }

    if (p.exact(endChar) !== endChar) {
      return nil;
    }

    this.accept(p);

    return elements;
  }
}
