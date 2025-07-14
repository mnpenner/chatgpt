import {defineTypeboxTool} from '../define-tool.ts'
import {Type} from '@sinclair/typebox'
import {appendQueryParams, encodeParam} from '../url-params.ts'

export default defineTypeboxTool({
    desc: "Generate a robot avatar image",
    params: Type.Object({
        key: Type.String({ description: "Any short unique string" }),
        set: Type.Optional(Type.Unsafe<"set1" | "set2" | "set3" | "set4">({ type: 'string', enum: ['set1', 'set2', 'set3', 'set4'], default: 'set1' })),
        size: Type.Optional(Type.String({ description: `An image size, like "500x500"` })),
    }),
    exec: ({ key, set, size }) => ({ imageUrl: appendQueryParams(`https://robohash.org/${encodeParam(key)}`, { set, size }) }),
})
