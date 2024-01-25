/**
 * Simulates clicking a link. i.e. redirects and puts originating page in browser session history.
 */
export function navigate(url: string): void {
    window.location.href = url
}

/**
 * Redirects to another page. Does not add originating page to browser session history.
 */
export function redirect(url: string): void {
    window.location.replace(url)
}

/**
 * Refreshes the current page. Will not re-POST data, unlike window.reload. Discards the #hash portion of the URL.
 */
export function refresh(): void {
    window.location.href = window.location.pathname + window.location.search
}
