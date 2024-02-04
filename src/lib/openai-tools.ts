import type OpenAI from 'openai'
import {Type, TSchema, type Static, TObject} from '@sinclair/typebox'
import {logJson, varDump} from './debug.ts'
import {Value} from '@sinclair/typebox/value'
import {okFetch} from './ajax.ts'


type FuncExec = (params: any) => any


type ToolWithFunc = {
    desc: string
    exec: FuncExec
    params: TSchema
}

function getCurrentPosition(): Promise<GeolocationPosition> {
    if(!navigator.geolocation?.getCurrentPosition) throw new Error("navigator.geolocation is unavailable")
    return new Promise((resolve,reject) => navigator.geolocation.getCurrentPosition(resolve,reject, {
        enableHighAccuracy: true,
        timeout: 5_000,
    }))
}

const tools: Record<string, ToolWithFunc> = {
    get_datetime: {
        desc: "Get the current date & time in the user's local timezone",
        exec: () => {
            const formatter = new Intl.DateTimeFormat(undefined, {
                dateStyle: 'full',
                timeStyle: 'full',
            })
            return formatter.format(new Date())
        },
        params: Type.Object({})
    },
    get_position: {
        desc: "Get the geo location (latitude and longitude) of the user",
        exec: async () => {
            const pos = await getCurrentPosition()
            const age = Date.now() - pos.timestamp
            return {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                // milliSecondsAgo: age,
                // age: new Intl.DurationFormat(undefined,{style:'long'}).format({milliseconds:age}),
            }
        },
        params: Type.Object({})
    },
    eval_js: {
        desc: "Evaluates JavaScript code represented as a string and returns its completion value. The source is parsed as a script.",
        exec: ({script}) => {
            return eval(script)
        },
        params: Type.Object({
            script: Type.String({
                description: "A string representing a JavaScript expression, statement, or sequence of statements. The expression can include variables and properties of existing objects. It will be parsed as a script, so import declarations (which can only exist in modules) are not allowed.",
            })
        })
    },
    // fetch_content: {
    //     desc: "Fetch text content of a web page",
    //     exec: async ({url}) => {
    //         const html = await okFetch({url}).then(res => res.text())
    //         const parser = new DOMParser();
    //         const doc = parser.parseFromString(html, 'text/html');
    //         return doc.body.innerText;
    //     },
    //     params: Type.Object({
    //         url: Type.String({
    //             description: "The URL of the resource you want to fetch."
    //         })
    //     })
    // },
}


export const openaiTools: OpenAI.Chat.Completions.ChatCompletionTool[] = Array.from(Object.entries(tools), ([key, val]) => ({
    type: 'function',
    function: {
        name: key,
        description: val.desc,
        parameters: val.params,
    }
}))

// logJson(openaiTools)

export async function callTool(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall): Promise<OpenAI.Chat.Completions.ChatCompletionToolMessageParam> {
    const tool = tools[toolCall.function.name]
    const rawArgs = JSON.parse(toolCall.function.arguments)
    const args = Value.Decode(tool.params, rawArgs)
    const result = await Promise.resolve(tool.exec(args)).catch((err: any) => ({error: String(err)}))

    return {
        tool_call_id: toolCall.id,
        role: "tool",
        // name: toolCall.function.name,
        content: JSON.stringify(result),
    }
}
