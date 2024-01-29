import {expect, describe,it} from 'bun:test'
import {jsonParse, jsonStringify} from './json-serialize.ts'

describe('json', () => {
    it('converts', () => {
        const obj = {
            undefined: undefined,
            null: null,
            bool: true,
            str: 'test',
            arr: [1, 2, 3],
            map: new Map([['a', 1], ['b', 2]]),
            set: new Set(['a', 'b', 'b', 'c']),
            date: new Date(1706503544246),
            // symbol: Symbol.for('cymbal'),
        }
        // console.log(jsonStringify(obj,2))
        expect(jsonParse(jsonStringify(obj))).toEqual(obj)
    })
})
