import {AnyFn} from './util-types'

export const EMPTY_OBJECT: Readonly<Record<PropertyKey, any>> = Object.freeze(Object.create(null))
export const NOOP: AnyFn = Object.freeze(() => {})

export const REDIRECT_CODE = 'redirect'

// https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format
export const SSE_PACKET_SEP = '\n\n'
export const SSE_LINE_SEP = '\n'
export const SSE_DONE = 'done'
export const SSE_DATA_PREFIX = 'data: ';
export const SSE_EVENT_PREFIX = 'event: ';
export const SSE_ID_PREFIX = 'id: ';
export const SSE_RETRY_PREFIX = 'retry: ';
