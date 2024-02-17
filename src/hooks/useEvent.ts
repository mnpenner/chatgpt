// https://github.com/scottrippey/react-use-event-hook/blob/75ba34af9175dc311afb3fb302d6fea44e4a5203/src/useEvent.ts
import {useInsertionEffect, useRef} from "react"
import {AnyFn, AnyObject, EventCallback} from '../types/util-types.ts'
import {NOOP} from '../lib/constants.ts'


/**
 * Similar to useCallback, with a few subtle differences:
 * - The returned function is a stable reference, and will always be the same between renders
 * - No dependency lists required
 * - Properties or state accessed within the callback will always be "current"
 */
export default function useEventHandler<TCallback extends AnyFn>(callback: TCallback): TCallback {
    const latestRef = useRef(callback)
    latestRef.current = callback

    return useRef(function(this: any) {
        return latestRef.current.apply(this, arguments as any)
    } as TCallback).current
}

export function useEvent<T>(handler: EventCallback<T>) {
    return useEventHandler(handler)
}

/**
 * Render methods should be pure, especially when concurrency is used,
 * so we will throw this error if the callback is called while rendering.
 */
function useEvent_shouldNotBeInvokedBeforeMount() {
    throw new Error("INVALID_USE_EVENT_INVOCATION: the callback from useEvent cannot be invoked before the component has mounted.")
}
