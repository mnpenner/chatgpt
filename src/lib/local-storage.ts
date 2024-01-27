import {JsonSerializable, jsonStringify} from './json.ts'

export function localStorageGetJson(key: string, defaultValue = null) {
    const item = localStorage.getItem(key)
    if(item === null) return defaultValue
    try {
        return JSON.parse(item)
    } catch {
        return defaultValue
    }
}

export function localStorageSetJson(key: string, value: JsonSerializable) {
    localStorage.setItem(key, jsonStringify(value))
}
