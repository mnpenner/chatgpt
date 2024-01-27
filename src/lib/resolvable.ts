// https://github.com/microsoft/TypeScript/issues/37663

import {AnyFn, Fn} from '../types/util-types.ts'

export type Resolvable<TValue = unknown, TArgs extends ReadonlyArray<unknown> = [unknown]> = TValue | ((...args: TArgs) => TValue);

export type Next<T> = Resolvable<T,[T]>

export type Resolved<T> = T extends Fn ? ReturnType<T> : T

export function resolveValue<TValue, TArgs extends ReadonlyArray<any>>(val: Resolvable<TValue, TArgs>, ...args: TArgs): TValue {
    return typeof val === 'function' ? (val as AnyFn)(...args) : val
}

