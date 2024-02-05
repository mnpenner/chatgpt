
export type UrlParam = string | number | boolean | undefined | null

export type QueryParams = Record<string,UrlParam|UrlParam[]>

export function encodeParam(x: UrlParam): string {
    if (x === true) {
        return '1';
    }
    if (x === false) {
        return '0';
    }
    if (x === undefined || x === null) {
        return '';
    }
    return encodeURIComponent(x);
}

export function encodeQueryParams(params: QueryParams): string {
    return Object.keys(params)
        .filter(k => params[k] !== undefined)
        .map(k => {
            const p = params[k]
            if (Array.isArray(p)) {
                return p
                    .map(val => `${encodeParam(k)}[]=${encodeParam(val)}`)
                    .join('&');
            }
            return `${encodeParam(k)}=${encodeParam(p)}`
        })
        .join('&');
}


export function appendQueryParams(url: string, params?: QueryParams) {
    if(params) {
        url += (url.includes('?') ? '&' : '?') + encodeQueryParams(params);
    }
    return url
}
