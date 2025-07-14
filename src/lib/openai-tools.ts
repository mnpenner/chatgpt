import type OpenAI from 'openai'
import toolImplementations from './tools/index.ts'

// --- Helper Functions ---

function getGeolocationErrorMessage(code: number): string {
    switch(code) {
        case 1:
            return "User denied the request for Geolocation."
        case 2:
            return "Location information is unavailable."
        case 3:
            return "The request to get user location timed out."
        default:
            return "An unknown geolocation error occurred."
    }
}

function formatExecutionError(err: any, toolName: string) {
    let errorDetail: any
    if(err?.constructor?.name === 'GeolocationPositionError') {
        errorDetail = {
            name: 'GeolocationPositionError',
            code: err.code,
            message: getGeolocationErrorMessage(err.code) + (err.message ? ` (${err.message})` : '')
        }
    } else if(err instanceof Error) {
        errorDetail = {name: err.name, message: err.message, stack: err.stack}
    } else if(typeof err === 'object' && err !== null) {
        try {
            errorDetail = JSON.parse(JSON.stringify(err))
        } catch(e) {
            errorDetail = String(err)
        }
    } else {
        errorDetail = err ? String(err) : "Unknown"
    }
    return {status: "error", message: `Error calling "${toolName}"`, error: errorDetail}
}

// --- Derived Data Structures (Side-Effect Free) ---

/**
 * The array of OpenAI-compatible tools, derived from our implementations.
 * This is what gets sent to the OpenAI API.
 */
export const openaiTools: OpenAI.Chat.Completions.ChatCompletionTool[] = Object.entries(toolImplementations).map(([name, tool]) => ({
    type: 'function',
    function: {
        name,
        description: tool.description,
        parameters: tool.parameters,
    },
}))


// --- Tool Execution Logic ---

function doCallTool(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall): any {
    const tool = toolImplementations[toolCall.function.name]
    if(!tool) {
        return formatExecutionError(`Tool "${toolCall.function.name}" not found.`, toolCall.function.name)
    }

    const rawArgs = JSON.parse(toolCall.function.arguments)

    // Call the encapsulated parse function which handles validation.
    const result = tool.parse(rawArgs)

    if(!result.success) {
        // The error object is already formatted by the parse function.
        return result.error
    }

    // `result.data` is the validated and decoded arguments.
    return Promise.resolve(tool.exec(result.data))
        .catch((err: any) => formatExecutionError(err, toolCall.function.name))
}

export async function callTool(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall): Promise<OpenAI.Chat.Completions.ChatCompletionToolMessageParam> {
    return {
        tool_call_id: toolCall.id,
        role: "tool",
        content: JSON.stringify(await doCallTool(toolCall)),
    }
}
