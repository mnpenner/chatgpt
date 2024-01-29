import {nil} from '../types/util-types.ts'

/**
 * Map over a Map. Returns an array.
 */
export function mapMap<K, V, R>(map: Map<K, V> | nil, callback: (v: V, k: K, i: number) => R) {
    return !map?.size ? [] : Array.from(map, ([k, v], i) => callback(v, k, i))
}

export function mapObj<K extends PropertyKey, V, R>(map: Record<K, V> | nil, callback: (v: V, k: K, i: number) => R) {
    return map == null ? [] : Reflect.ownKeys(map).map((k,i) => callback(map[k as K],k as K,i))
}

export function mapIter<In, Out>(iterable: Iterable<In>, cb: (el: In, i: number) => Out): Out[] {
    const out = []
    let i = 0
    for(const x of iterable) {
        out.push(cb(x, i++))
    }
    return out
}
