import type {AnyArray, AnyFn, AnyObject} from '../types/util-types'

export const EMPTY_OBJECT: Readonly<AnyObject> = Object.freeze(Object.create(null))
export const EMPTY_ARRAY: Readonly<AnyArray> = Object.freeze([])
export const NOOP: Readonly<AnyFn> = Object.freeze(() => {})


