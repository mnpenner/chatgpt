import React from 'react'

export function getComponentName(Component: React.ElementType): string {
    if(typeof Component === 'string') {
        return Component // Intrinsic elements like 'div', 'span', etc.
    }

    return Component.displayName || Component.name || 'Unknown'
}
