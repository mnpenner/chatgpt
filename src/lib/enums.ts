

export const enum ContentTypes  {
    JSON = 'application/json',
    HTML = 'text/html; charset=utf-8',
    OCTET_STREAM = 'application/octet-stream',
    EVENT_STREAM = 'text/event-stream',
}

export const enum CommonHeaders  {
    CONTENT_TYPE = 'content-type',
    ACCEPT = 'accept',
    CACHE_CONTROL = 'Cache-Control',
    CONNECTION = 'Connection',
    AUTHORIZATION = 'Authorization',
}

export const enum HttpStatus {
    /**
     * Standard response for successful HTTP requests. The actual response will depend on the request method used. In a
     * GET request, the response will contain an entity corresponding to the requested resource. In a POST request, the
     * response will contain an entity describing or containing the result of the action.
     */
    OK = 200,
    /**
     * The server cannot or will not process the request due to an apparent client error (e.g., malformed request
     * syntax, size too large, invalid request message framing, or deceptive request routing).
     */
    BAD_REQUEST = 400,
    /**
     * A generic error message, given when an unexpected condition was encountered and no more specific message is
     * suitable.
     */
    SERVER_ERROR = 500,

    NOT_IMPLEMENTED = 501,
}

export const enum ErrorCodes {
    SERVER = 'SERVER',
    VALIDATION = 'VALIDATION',
}

export const enum RpsMove {
    UNKNOWN = 0,
    ROCK = 1,
    PAPER = 2,
    SCISSORS = 3,
}

export const enum GamePlayWinner {
    UNKNOWN = 0,
    BOT1 = 1,
    BOT2 = 2,
    DRAW = 3,
}
