// https://github.com/microsoft/TypeScript/issues/37663
import {Fn} from './util-types'

export type Resolvable<TValue = unknown, TArgs extends ReadonlyArray<unknown> = []> = TValue extends any ? TValue | ((...args: TArgs) => TValue) : never

export type Resolved<T> = T extends Fn ? ReturnType<T> : T

export function resolveValue<TValue, TArgs extends ReadonlyArray<any>>(val: Resolvable<TValue, TArgs>, ...args: TArgs): TValue {
    return typeof val === 'function' ? val(...args) : val
}

