export function identity<T>(x: T): T {
    return x
}

let id=0
export function uniqId() {
    return '$'+(id++).toString(36)
}
