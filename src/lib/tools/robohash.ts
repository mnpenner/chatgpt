import {defineZodTool} from '../define-tool.ts'
import {z} from 'zod'
import {appendQueryParams, encodeParam} from '../url-params.ts'

export default defineZodTool({
    desc: "Generate a robot avatar image",
    params: z.object({
        key: z.string().describe("Any short unique string"),

        // The Zod equivalent for a string enum
        set: z.enum(['set1', 'set2', 'set3', 'set4'])
            .optional()
            .default('set1')
            .describe(`Image set. "set1" is robots, "set2" is monsters, "set3" is suave, disembodied heads, "set4" is kittens`),

        size: z.string().optional().describe(`An image size, like "500x500"`),
    }),
    exec: ({key, set, size}) => ({
        imageUrl: appendQueryParams(`https://robohash.org/${encodeParam(key)}`, {
            set,
            size
        })
    }),
})
