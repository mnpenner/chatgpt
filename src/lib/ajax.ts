import {CommonHeaders, ContentTypes} from './enums'
import {nil} from './util-types'
import {EMPTY_OBJECT} from './constants.ts'

interface RequestInitUrl extends RequestInit {
    url: string
}

// The `Request` constructor is weird. Wrap it to take URL as an option.
function createRequest({url, ...opts}: RequestInitUrl): Request {
    return new Request(url, opts)
}

export type PlainHeaders = Record<string, string>
export type AnyHeaders = Headers|PlainHeaders|nil

interface BaseFetchOptions extends RequestInitUrl {
    timeout?: number
    /**
     * Adds `Authorization: Bearer ${bearerToken}` header.
     */
    bearerToken?: string
    headers?: PlainHeaders|Headers
}

function plainHeaders(headers: Headers|PlainHeaders|nil): PlainHeaders {
    if(headers == null) return EMPTY_OBJECT
    if(headers instanceof Headers) {
        return Object.fromEntries(headers.entries())
    }
    return headers;
}

function mergeHeaders(a: AnyHeaders, b: AnyHeaders) {
    return {...plainHeaders(a), ...plainHeaders(b)}
}

/**
 * Similar to normal {@link fetch} but with more options and better defaults.
 * Returns the `request` object for debugging, the `response` as normal, and `elapsed` time (ms) for testing
 * performance.
 */
export function baseFetch({headers, timeout, bearerToken, ...opts}: BaseFetchOptions) {
    if(timeout) {
        opts.signal = AbortSignal.timeout(timeout)
    }
    const request = createRequest({
        headers: mergeHeaders(bearerToken ? {Authorization: `Bearer ${bearerToken}`} : null, headers),
        mode: 'cors',  // Must use cors for non-simple requests
        credentials: 'omit',
        ...opts,
    })
    const start = performance.now()
    return fetch(request).then(response => ({
        request,
        response,
        elapsed: performance.now() - start,
    }))
}

/**
 * Same as {@link baseFetch} but throws if the response is not OK.
 */
export function okFetch(opts: BaseFetchOptions) {
    return baseFetch(opts).then(({request, response}) => okResponse(request, response))
}

/**
 * Same as {@link okFetch} but defaults to POST.
 */
export function post(opts: BaseFetchOptions) {
    return okFetch({
        method: 'POST',
        ...opts,
    })
}

function okResponse(req: Request, res: Response): Response | never {
    if(res.ok) {
        return res
    }
    if(res.type === 'opaqueredirect') {
        throw new Error(`Unexpected redirect in response to ${req.method} ${req.url}`)
    }
    if(res.status === 0) {
        throw new Error(`Unexpected 0 status in response to ${req.method} ${req.url}`)
    }
    throw new Error(`${res.status} ${res.statusText}`)
}

/**
 * Get JSON from the server.
 */
function getJson<TRes>(opts: BaseFetchOptions): Promise<TRes> {
    return okFetch({
        ...opts,
        headers: mergeHeaders({[CommonHeaders.ACCEPT]: ContentTypes.JSON}, opts.headers),
    }).then(res => res.json())
}

type PostJsonOptions = Omit<BaseFetchOptions, 'url' | 'body'>

/**
 * Post JSON to the server, accept JSON back.
 */
export function postJson<TRes = unknown, TReq = unknown>(url: string, data: TReq, opts: PostJsonOptions=EMPTY_OBJECT): Promise<TRes> {
    return getJson({
        method: 'POST',
        ...opts,
        headers: mergeHeaders({[CommonHeaders.CONTENT_TYPE]: ContentTypes.JSON}, opts.headers),
        body: JSON.stringify(data),
        url,
    })
}
