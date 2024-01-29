import {jsonStringify} from './json-serialize.ts'

export function varDump(x: any) {
    if(x === undefined) return '(undefined)'
    return jsonStringify(x, 2)
}


export function logJson(...vars: any) {
    console.log(...vars.map((x: any) => varDump(x)))
}
