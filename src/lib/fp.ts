import {Resolvable, resolveValue} from './resolvable.ts'

/**
 * Merge one or more objects into a target object, similar to
 * [`Object.assign`]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign}, but each value can be a function that takes the previous value for that key and returns a new one.
 *
 * The target object *should* be the full object (with all keys defined), and the objects to be merged may be partial.
 * If the target and objects to be merged do not sum up to the full object then the return type will be invalid.
 *
 * @deprecated Use imut-utils
 */
export function fpShallowMerge<T extends {}>(...objects: Array<{
    [K in keyof T]?: Resolvable<T[K], [T[K], K]>;
}>): (obj: T) => T {
    return (obj: T) => {
        const filtered = objects.filter(o => o != null)
        if(!filtered.length) {
            return obj
        }
        const ret = Object.assign(Object.create(null) as {}, obj)
        for(const o of filtered) {
            for(const k of Object.keys(o) as Array<keyof T>) {
                ret[k] = resolveValue(o[k] as any, ret[k], k) as T[keyof T]
            }
        }
        return ret
    }
}
