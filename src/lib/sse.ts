// https://github.com/mpetazzoni/sse.js/blob/main/lib/sse.js


import {JsonResponse, JsonSerializable, jsonStringify} from './json'
import {CommonHeaders, ContentTypes} from './enums'

// https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format
export const SSE_PACKET_SEP = '\n\n'
export const SSE_LINE_SEP = '\n'
export const SSE_DONE = 'done'
export const SSE_DATA_PREFIX = 'data: ';
export const SSE_EVENT_PREFIX = 'event: ';
export const SSE_ID_PREFIX = 'id: ';
export const SSE_RETRY_PREFIX = 'retry: ';


interface SseOptions {
    url: string
    body: JsonSerializable
    bearerToken?: string
    onMessage: (message: ServerSentEvent) => void
    /**
     * Fired when the transaction completes successfully.
     */
    onSuccess?: () => void
    /**
     * Fired when the request encountered an error.
     */
    onError?: () => void
    /**
     * Fired when a request has been aborted.
     */
    onAbort?: () => void
    /**
     * Fired when a request has completed, whether successfully or unsuccessfully (after abort or error).
     */
    onFinish?: () => void
    /**
     * Called just before the XHR request is sent.
     */
    onStart?: (xhr: XMLHttpRequest) => void
    /**
     * Fired when progress is terminated due to preset time expiring.
     */
    onTimeout?: () => void
}

// https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#fields
type ServerSentEvent = {
    /**
     * A string identifying the type of event described. If this is specified, an event will be dispatched on the browser to the listener for the specified event name; the website source code should use addEventListener() to listen for named events. The onmessage handler is called if no event name is specified for a message.
     */
    event?: string
    /**
     * The data field for the message. When the EventSource receives multiple consecutive lines that begin with data:, it concatenates them, inserting a newline character between each one. Trailing newlines are removed.
     */
    data: any
    /**
     * The event ID to set the EventSource object's last event ID value.
     */
    id?: string
    /**
     * The reconnection time. If the connection to the server is lost, the browser will wait for the specified time before attempting to reconnect. This must be an integer, specifying the reconnection time in milliseconds. If a non-integer value is specified, the field is ignored.
     */
    retry?: number
}


export function postSSE({url, body, bearerToken, onMessage,onSuccess,onStart,onError,onAbort,onFinish,onTimeout}: SseOptions) {
    const xhr = new XMLHttpRequest()
    let progress = 0
    let unparsed = ''
    xhr.addEventListener('progress', _ev => {
        const chunk = unparsed + xhr.responseText.slice(progress)
        progress = xhr.responseText.length
        const packets = chunk.split(SSE_PACKET_SEP)
        unparsed = packets.pop()!
        for(const packet of packets) {
            const lines = packet.split(SSE_LINE_SEP)
            const message: ServerSentEvent = Object.create(null)
            for(const line of lines) {
                const [field, payload] = line.split(': ', 2)
                if(payload === undefined) throw new Error("Missing payload")

                if(field === 'data') {
                    if(payload === '[DONE]') return  // Hack for OpenAI.
                    message[field] = JSON.parse(payload)
                } else {
                    (message as any)[field] = payload
                }
            }
            onMessage(message)

        }
    })
    if(onAbort) xhr.addEventListener('abort',onAbort)
    if(onError) xhr.addEventListener('error',onError)
    if(onSuccess) xhr.addEventListener('load',onSuccess)
    if(onFinish) xhr.addEventListener('loadend',onFinish)
    if(onTimeout) xhr.addEventListener('timeout',onTimeout)
    // xhr.addEventListener('load', () => {
    //     console.log('load')
    // })
    // xhr.addEventListener('loadend', () => {
    //     console.log('loadend')
    //     onFinish?.()
    // })
    xhr.open('POST', url)
    if(bearerToken) {
        xhr.setRequestHeader(CommonHeaders.AUTHORIZATION, `Bearer ${bearerToken}`)
    }
    xhr.setRequestHeader(CommonHeaders.ACCEPT, ContentTypes.EVENT_STREAM)
    xhr.setRequestHeader(CommonHeaders.CONTENT_TYPE, ContentTypes.JSON)
    if(onStart) onStart(xhr)
    xhr.send(jsonStringify(body))
}

// type ChatCompletions = Override<SseOptions, {}>
//
// export function chatCompletions(opts: Omit<SseOptions,'url'>) {
//     return postSSE({
//         url: 'https://api.openai.com/v1/chat/completions',
//         ...opts,
//     })
// }

