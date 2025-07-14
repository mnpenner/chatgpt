import {defineTypeboxTool} from '../define-tool.ts'
import {Type} from '@sinclair/typebox'
import {appendQueryParams, encodeParam} from '../url-params.ts'

export default defineTypeboxTool({
    desc: "Generate a robot avatar image",
    params: Type.Object({
        key: Type.String({description: "Any short unique string"}),

        // CORRECTED: Replaced Type.Unsafe with a standard Type.Union of Type.Literals
        set: Type.Optional(Type.Union([
            Type.Literal('set1'),
            Type.Literal('set2'),
            Type.Literal('set3'),
            Type.Literal('set4'),
        ], {
            // Options like default and description are passed to the Union
            default: 'set1',
            description: `Image set. "set1" is robots, "set2" is monsters, "set3" is suave, disembodied heads, "set4" is kittens`
        })),

        size: Type.Optional(Type.String({description: `An image size, like "500x500"`})),
    }),
    exec: ({key, set, size}) => ({
        imageUrl: appendQueryParams(`https://robohash.org/${encodeParam(key)}`, {
            set,
            size
        })
    }),
})
