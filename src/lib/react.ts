import React, {Ref, RefCallback, RefObject} from 'react'

export function getComponentName(Component: React.ElementType): string {
    if(typeof Component === 'string') {
        return Component // Intrinsic elements like 'div', 'span', etc.
    }

    return Component.displayName || Component.name || 'Unknown'
}

export function onRef<T extends HTMLElement>(fn: (el:T)=>void): RefCallback<T> {
    return el => {
        if(el != null) {
            fn(el)
        }
    }
}

export function refContains<T extends Node>(ref: RefObject<T>, el: Node) {
    return ref.current != null && ref.current.contains(el)
}
