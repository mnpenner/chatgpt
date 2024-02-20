import type OpenAI from 'openai'
import {Type, TSchema, type Static, TObject, TLiteralValue} from '@sinclair/typebox'
import {logJson, varDump} from './debug.ts'
import {Value} from '@sinclair/typebox/value'
import {okFetch} from './ajax.ts'
import {getGoogleMapsDirectionsUrl} from './google-maps.ts'
import {appendQueryParams, encodeParam} from './url-params.ts'
import {ModelState} from '../state/model-state.ts'


type FuncExec = (params: any) => any


type ToolWithFunc = {
    desc: string
    exec: FuncExec
    params: TSchema
}

function getCurrentPosition(): Promise<GeolocationPosition> {
    if(!navigator.geolocation?.getCurrentPosition) throw new Error("navigator.geolocation is unavailable")
    return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5_000,
    }))
}

const StringEnum = <T extends Array<TLiteralValue>>(values: [...T]) => Type.Union(values.map(s => Type.Literal(s)))

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
            return new Promise((resolve, reject) => {
                const workerScript = URL.createObjectURL(new Blob([`
                    onmessage = ev => postMessage(eval(ev.data));
                `], {type: 'application/javascript'}))

                const worker = new Worker(workerScript)
                URL.revokeObjectURL(workerScript)

                worker.onmessage = ev => {
                    resolve(ev.data)
                    worker.terminate() // Terminate worker after it has finished its job
                }
                worker.onerror = error => {
                    reject(error)
                    worker.terminate() // Terminate worker in case of an error
                }

                worker.postMessage(script)
            })
        },
        params: Type.Object({
            script: Type.String({
                description: "A string representing a JavaScript expression, statement, or sequence of statements. The expression can include variables and properties of existing objects. It will be parsed as a script, so import declarations (which can only exist in modules) are not allowed.",
            })
        })
    },
    google_maps_directions: {
        desc: "Return a URL to Google Maps for travel directions. Google knows the user's current location.",
        params: Type.Object({
            waypoints: Type.Array(Type.String(), {
                minItems: 2,
                description: "List of waypoints. Must contain an origin and destination at a minimum. Origin can be an empty string to mean travel from current location.",
            }),
            travelmode: Type.Optional(Type.String({
                description: `When you calculate directions, you need to specify which transportation mode to use. The following travel modes are currently supported:

- "DRIVING" (Default) indicates standard driving directions using the road network.
- "BICYCLING" requests bicycling directions via bicycle paths & preferred streets.
- "TRANSIT" requests directions via public transit routes.
- "WALKING" requests walking directions via pedestrian paths & sidewalks.`
            })),
        }),
        exec: ({waypoints, travelmode}) => {
            return {directionsUrl: getGoogleMapsDirectionsUrl(waypoints, travelmode)}
        }
    },
    static_google_map: {
        desc: "Get a URL static Google Map image. An API key will automatically be appended to the URL and should not be removed.",
        params: Type.Object({
            center: Type.String({
                description: "Defines the center of the map, equidistant from all edges of the map. This parameter takes a location as either a comma-separated {latitude,longitude} pair (e.g. \"40.714728,-73.998672\") or a string address (e.g. \"city hall, new york, ny\") identifying a unique location on the face of the earth."
            }),
            size: Type.String({
                description: "Defines the rectangular dimensions of the map image. This parameter takes a string of the form {horizontal_value}x{vertical_value}. For example, 500x400 defines a map 500 pixels wide by 400 pixels high.",
                default: "600x600",
            }),
        }),
        exec: params => {
            // https://developers.google.com/maps/documentation/javascript/directions#TravelModes
            return {
                imageUrl: appendQueryParams('https://maps.googleapis.com/maps/api/staticmap', {
                    ...params,
                    key: ModelState.getSnapshot().googleMapsKey,
                })
            }
        }
    },
    robohash: {
        desc: "Generate a robot avatar image",
        params: Type.Object({
            key: Type.String({
                description: "Any short unique string",
            }),
            set: Type.Optional(Type.String({
                default: "set1",
                description: `Image set. "set1" is robots, "set2" is monsters, "set3" is suave, disembodied heads, "set4" is kittens`,
            })),
            size: Type.Optional(Type.String({
                description: `An image size, like "500x500"`
            }))
        }),
        exec: ({key, set, size}) => {
            return {
                imageUrl: appendQueryParams(`https://robohash.org/${encodeParam(key)}`, {set, size})
            }
        }
    }
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

function doCallTool(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall): any {
    const tool = tools[toolCall.function.name]
    const rawArgs = JSON.parse(toolCall.function.arguments)

    const errors = Array.from(Value.Errors(tool.params, rawArgs))

    if(errors.length) {
        return {
            status: "error",
            message: "Error validating input parameters",
            errors,
        }
    }

    const args = Value.Decode(tool.params, rawArgs)

    return Promise.resolve(tool.exec(args))
        .catch((err: any) => {
            return {
                status: "error",
                message: `Error calling "${toolCall.function.name}"`,
                error: (err ? (err.message || String(err)) : null) || "Unknown",
            }
        })
}


export async function callTool(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall): Promise<OpenAI.Chat.Completions.ChatCompletionToolMessageParam> {
    return {
        tool_call_id: toolCall.id,
        role: "tool",
        // name: toolCall.function.name,
        content: JSON.stringify(await doCallTool(toolCall)),
    }
}
