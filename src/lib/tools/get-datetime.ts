import {defineZodTool} from '../define-tool.ts'
import {z} from 'zod'

export default defineZodTool({
    desc: "Get the current date & time in the user's local timezone",
    params: z.object({}),
    exec: () => new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'full' }).format(new Date()),
})
