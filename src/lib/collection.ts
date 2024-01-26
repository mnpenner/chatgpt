import {nil} from '../types/util-types.ts'

/**
 * Map over a Map. Returns an array.
 */
export function mapMap<K, V, R>(map: Map<K, V> | nil, callback: (v: V, k: K, i: number) => R) {
    return !map?.size ? [] : Array.from(map, ([k, v], i) => callback(v, k, i))
}
