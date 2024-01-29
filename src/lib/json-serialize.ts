const TYPE_KEY = '__js$type'

function jsonReplacer(this: any, key: string, _value: any): any {
    // value arg is not the same as this[key]. value is pre-transformed and doesn't work for dates.
    // https://stackoverflow.com/questions/31096130/how-to-json-stringify-a-javascript-date-and-preserve-timezone#comment121087544_54037861
    const value = this[key]
    if(value instanceof Set) {
        return {[TYPE_KEY]: 'Set', value: Array.from(value)}
    }
    if(value instanceof Map) {
        return {[TYPE_KEY]: 'Map', value: Array.from(value)}
    }
    if(value instanceof Date) {
        return {[TYPE_KEY]: 'Date', value: value.valueOf()}
    }
    // TODO: fix symbols, if we care: https://stackoverflow.com/a/56928839/65387
    // if(value instanceof Symbol) {
    //     return {[TYPE_KEY]: 'Symbol', value: value.description}
    // }
    // if(value === undefined) {
    //     return {[TYPE_KEY]: 'undefined'}
    // }
    return value
}

function jsonReviver(this: any, _key: string, value: any): any {
    if(value != null && typeof value === 'object' && typeof value[TYPE_KEY] === 'string') {
        switch(value[TYPE_KEY]) {
            case 'Map':
                return new Map(value.value)
            case 'Set':
                return new Set(value.value)
            case 'Date':
                return new Date(value.value)
            // case 'Symbol':
            //     return Symbol.for(value.value)
            // case 'undefined':
            //     return undefined
            default:
                throw new Error(`Unhandled ${TYPE_KEY}: ${value[TYPE_KEY]}`)
        }
    }
    return value
}

export function jsonStringify(obj: any, space?: string | number): string {
    return JSON.stringify(obj, jsonReplacer, space)
}

export function jsonParse(json: string): any {
    return JSON.parse(json, jsonReviver)
}
