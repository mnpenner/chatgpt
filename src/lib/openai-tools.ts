import type OpenAI from 'openai'
import { z, ZodSchema } from 'zod'
import { logJson, varDump } from './debug.ts'
import { okFetch } from './ajax.ts'
import { getGoogleMapsDirectionsUrl } from './google-maps.ts'
import { appendQueryParams, encodeParam } from './url-params.ts'
import { ModelState } from '../state/model-state.ts'

type FuncExec = (params: any) => any

type ToolWithFunc = {
    desc: string
    exec: FuncExec
    params: ZodSchema
}

function getCurrentPosition(): Promise<GeolocationPosition> {
    if (!navigator.geolocation?.getCurrentPosition) throw new Error("navigator.geolocation is unavailable")
    return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5_000,
    }))
}

/**
 * Gets a descriptive message for a GeolocationPositionError code.
 * @param code The error code.
 * @returns A descriptive string.
 */
function getGeolocationErrorMessage(code: number): string {
    switch (code) {
        case 1:
            return "User denied the request for Geolocation.";
        case 2:
            return "Location information is unavailable.";
        case 3:
            return "The request to get user location timed out.";
        default:
            return "An unknown geolocation error occurred.";
    }
}


/**
 * Formats an error from a tool execution into a structured object.
 * @param err The error caught during execution.
 * @param toolName The name of the tool that failed.
 * @returns A structured error object.
 */
function formatExecutionError(err: any, toolName: string) {
    let errorDetail: any;

    if (err?.constructor?.name === 'GeolocationPositionError') {
        errorDetail = {
            name: 'GeolocationPositionError',
            code: err.code,
            message: getGeolocationErrorMessage(err.code) + (err.message ? ` (${err.message})` : '')
        };
    } else if (err instanceof Error) {
        errorDetail = {
            name: err.name,
            message: err.message,
            stack: err.stack,
        };
    } else if (typeof err === 'object' && err !== null) {
        try {
            errorDetail = JSON.parse(JSON.stringify(err));
        } catch (e) {
            errorDetail = String(err);
        }
    } else {
        errorDetail = err ? String(err) : "Unknown";
    }

    return {
        status: "error",
        message: `Error calling "${toolName}"`,
        error: errorDetail,
    }
}

/**
 * Defines a tool with a Zod schema for parameters and a strongly-typed execution function.
 * @param tool The tool definition.
 * @returns A ToolWithFunc object.
 */
function defineTool<P extends ZodSchema>(
    tool: {
        desc: string,
        params: P,
        exec: (params: z.infer<P>) => any
    }
): ToolWithFunc {
    return tool;
}

const tools: Record<string, ToolWithFunc> = {
    get_datetime: defineTool({
        desc: "Get the current date & time in the user's local timezone",
        params: z.object({}),
        exec: () => {
            const formatter = new Intl.DateTimeFormat(undefined, {
                dateStyle: 'full',
                timeStyle: 'full',
            })
            return formatter.format(new Date())
        },
    }),
    get_position: defineTool({
        desc: "Get the geo location (latitude and longitude) of the user",
        params: z.object({}),
        exec: async () => {
            const pos = await getCurrentPosition()
            return {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            }
        },
    }),
    eval_js: defineTool({
        desc: "Evaluates JavaScript code represented as a string and returns its completion value. The source is parsed as a script.",
        params: z.object({
            script: z.string().describe("A string representing a JavaScript expression, statement, or sequence of statements. The expression can include variables and properties of existing objects. It will be parsed as a script, so import declarations (which can only exist in modules) are not allowed."),
        }),
        exec: ({ script }) => {
            return new Promise((resolve, reject) => {
                const workerScript = URL.createObjectURL(new Blob([`
                    onmessage = ev => postMessage(eval(ev.data));
                `], { type: 'application/javascript' }))

                const worker = new Worker(workerScript)
                URL.revokeObjectURL(workerScript)

                worker.onmessage = ev => {
                    resolve(ev.data)
                    worker.terminate()
                }
                worker.onerror = error => {
                    reject(error)
                    worker.terminate()
                }

                worker.postMessage(script)
            })
        },
    }),
    google_maps_directions: defineTool({
        desc: "Return a URL to Google Maps for travel directions. Google knows the user's current location.",
        params: z.object({
            waypoints: z.array(z.string()).min(2).describe("List of waypoints. Must contain an origin and destination at a minimum. Origin can be an empty string to mean travel from current location."),
            travelmode: z.string().optional().describe(`When you calculate directions, you need to specify which transportation mode to use. The following travel modes are currently supported:

- "DRIVING" (Default) indicates standard driving directions using the road network.
- "BICYCLING" requests bicycling directions via bicycle paths & preferred streets.
- "TRANSIT" requests directions via public transit routes.
- "WALKING" requests walking directions via pedestrian paths & sidewalks.`),
        }),
        exec: ({ waypoints, travelmode }) => {
            return { directionsUrl: getGoogleMapsDirectionsUrl(waypoints, travelmode) }
        }
    }),
    static_google_map: defineTool({
        desc: "Get a URL static Google Map image. An API key will automatically be appended to the URL and should not be removed.",
        params: z.object({
            center: z.string().describe("Defines the center of the map, equidistant from all edges of the map. This parameter takes a location as either a comma-separated {latitude,longitude} pair (e.g. \"40.714728,-73.998672\") or a string address (e.g. \"city hall, new york, ny\") identifying a unique location on the face of the earth."),
            size: z.string().default("600x600").describe("Defines the rectangular dimensions of the map image. This parameter takes a string of the form {horizontal_value}x{vertical_value}. For example, 500x400 defines a map 500 pixels wide by 400 pixels high."),
        }),
        exec: (params) => {
            return {
                imageUrl: appendQueryParams('https://maps.googleapis.com/maps/api/staticmap', {
                    ...params,
                    key: ModelState.getSnapshot().googleMapsKey,
                })
            }
        }
    }),
    robohash: defineTool({
        desc: "Generate a robot avatar image",
        params: z.object({
            key: z.string().describe("Any short unique string"),
            set: z.enum(["set1", "set2", "set3", "set4"]).default("set1").optional().describe(`Image set. "set1" is robots, "set2" is monsters, "set3" is suave, disembodied heads, "set4" is kittens`),
            size: z.string().optional().describe(`An image size, like "500x500"`)
        }),
        exec: ({ key, set, size }) => {
            return {
                imageUrl: appendQueryParams(`https://robohash.org/${encodeParam(key)}`, { set, size })
            }
        }
    })
}

export const openaiTools: OpenAI.Chat.Completions.ChatCompletionTool[] = Array.from(Object.entries(tools), ([key, val]) => ({
    type: 'function',
    function: {
        name: key,
        description: val.desc,
        parameters: z.toJSONSchema(val.params),
    }
}))

// logJson(openaiTools)

function doCallTool(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall): any {
    const tool = tools[toolCall.function.name]
    const rawArgs = JSON.parse(toolCall.function.arguments)

    const result = tool.params.safeParse(rawArgs)

    if (!result.success) {
        return {
            status: "error",
            message: "Error validating input parameters",
            errors: z.flattenError(result.error),
        }
    }

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
