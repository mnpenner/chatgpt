import React, {RefCallback} from 'react'

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
