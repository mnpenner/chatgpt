export function identity<T>(x: T): T {
    return x
}

let id=0
export function uniqId() {
    return '$'+(id++).toString(36)
}

export function fullWide(n: number): string {
    try {
        return n.toLocaleString('en-US', {useGrouping: false, maximumFractionDigits: 20})
    } catch {
        return n.toFixed(14).replace(/\.?0+$/, '')
    }
}

export const sleep = (ms:number) => new Promise(r => setTimeout(r,ms))
