import type en from "@/messages/en.json";

export type Messages = typeof en;

type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, unknown>
    ? `${K}.${PathImpl<T[K], keyof T[K] & string>}`
    : K
  : never;

export type MessageKey = PathImpl<Messages, keyof Messages & string>;

export type TFunction = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function createT(messages: Messages): TFunction {
  return (key, vars) => {
    let str: string = key;
    let current: unknown = messages;
    for (const part of key.split(".")) {
      if (typeof current !== "object" || current === null) break;
      current = (current as Record<string, unknown>)[part];
      if (typeof current === "string") str = current;
    }
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  };
}
