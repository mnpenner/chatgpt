export type EmptyObject = Record<PropertyKey, never>
export type UnknownObject = Record<PropertyKey, unknown>
export type AnyObject = Record<PropertyKey, any>
export type AnyArray = any[]

export type nil = null | undefined

export type Fn<TArgs extends ReadonlyArray<unknown> = unknown[], TRet = unknown> = (...args: TArgs[]) => TRet
export type EventCallback<T = never> = (ev: T) => void
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


export type Override<Base, Extension, DeleteKeys extends PropertyKey=never> = Omit<Base, keyof Extension|DeleteKeys> & Extension
export type OverrideProps<Base extends import('react').ElementType, Extension, DeleteKeys extends PropertyKey = never> = Override<import('react').ComponentPropsWithoutRef<Base>, Extension, DeleteKeys>

export type RequiredKeys<Type, Key extends keyof Type> = Omit<Type, Key> & Required<Pick<Type, Key>>
export type OptionalKeys<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>
