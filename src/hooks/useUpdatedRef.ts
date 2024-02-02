import {useRef} from 'react'

/**
 * Wraps a callback in a ref object.
 *
 * Useful to avoid re-renders from ever-changing callbacks.
 * Always returns the same object (referentially equal), but the `current` value will be kept up to date.
 */
export function useUpdatedRef<T>(value: T) {
    const ref = useRef(value)
    ref.current = value
    return ref
}
