export type EmptyObject = Record<PropertyKey, never>
export type UnknownObject = Record<PropertyKey, unknown>
export type AnyObject = Record<PropertyKey, any>
export type AnyArray = any[]
export type AnyDbEntity = Record<string, string | number>

export type nil = null | undefined

export type Fn<TArgs extends ReadonlyArray<unknown> = unknown[], TRet = unknown> = (...args: TArgs[]) => TRet

export type AnyFn = (...args: any[]) => any


// https://stackoverflow.com/a/69062575/65387 ->
// https://stackoverflow.com/questions/65805600/type-union-not-checking-for-excess-properties#answer-65805753 ->
// https://stackoverflow.com/questions/52677576/typescript-discriminated-union-allows-invalid-state/52678379#52678379
type _UnionKeys<T> = T extends T ? keyof T : never;

type _StrictUnionHelper<T, TAll> =
    T extends any
        ? T & Partial<Record<Exclude<_UnionKeys<TAll>, keyof T>, never>> : never;

// See also: https://github.com/ts-essentials/ts-essentials#xor
export type XOR<T> = _StrictUnionHelper<T, T>
