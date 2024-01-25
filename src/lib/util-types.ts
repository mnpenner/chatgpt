export type EmptyObject = Record<PropertyKey, never>
export type UnknownObject = Record<PropertyKey, unknown>
export type AnyObject = Record<PropertyKey, any>
export type AnyDbEntity = Record<string, string|number>

export type nil = null|undefined

export type Fn<TArgs extends ReadonlyArray<unknown>=unknown[], TRet=unknown> = (...args: TArgs[]) => TRet

export type AnyFn = (...args: any[]) => any
