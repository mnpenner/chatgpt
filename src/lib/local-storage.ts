import {JsonSerializable} from '../types/json-types.ts'
import {jsonParse, jsonStringify} from './json-serialize.ts'

export function localStorageGetJson(key: string, defaultValue = null) {
    const item = localStorage.getItem(key)
    if(item === null) return defaultValue
    try {
        return jsonParse(item)
    } catch {
        return defaultValue
    }
}

export function localStorageSetJson(key: string, value: JsonSerializable) {
    localStorage.setItem(key, jsonStringify(value))
}
