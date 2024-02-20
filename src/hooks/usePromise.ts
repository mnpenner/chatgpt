import {DependencyList, useEffect, useRef, useState} from "react"
import {EMPTY_ARRAY} from '../lib/constants.ts'

export type UsePromiseResult<V, E> = {
    /** Value if promise was fulfilled. */
    value: V | undefined
    /** Error reason if promise was rejected. */
    error: E | undefined,
    /** Initial state. Promise is loading for the first time. */
    loading: boolean
    /** Promise is loading or re-loading. */
    pending: boolean
}

export default function usePromise<V, E>(cb: () => Promise<V>, deps: DependencyList=EMPTY_ARRAY): UsePromiseResult<V, E> {
    const [state, setState] = useState<UsePromiseResult<V, E>>({
        value: undefined,
        error: undefined,
        loading: true,
        pending: true,
    })
    const counter = useRef<number>(0)
    const greatestSettled = useRef<number>(-1)
    const cbRef = useRef(cb)

    // Update cbRef on each render to ensure it has the latest version of `cb`
    cbRef.current = cb

    useEffect(() => {
        const current = ++counter.current
        let abort = false

        setState(s => s.pending ? s : {...s, pending: true})

        Promise.resolve(cbRef.current()).then(value => {
            if(abort) {
                if(import.meta.env.DEV) {
                    console.debug('[usePromise] Promise fulfilled after unmount')
                }
                return
            }
            if(current > greatestSettled.current) {
                // Erase the error.
                setState({value, error: undefined, loading: false, pending: current !== counter.current})
                greatestSettled.current = current
            } else if(import.meta.env.DEV) {
                console.debug('[usePromise] Resolved promise discarded due to newer deps', value)
            }
        }, error => {
            if(abort) {
                if(import.meta.env.DEV) {
                    console.debug('[usePromise] Promise failed after unmount')
                }
                return
            }
            if(current > greatestSettled.current) {
                // Don't overwrite existing value in case we want to keep displaying it when there's an error.
                setState(({value}) => ({value, error, loading: false, pending: current !== counter.current}))
                greatestSettled.current = current
            } else if(import.meta.env.DEV) {
                console.debug('[usePromise] Rejected promise discarded due to newer deps', error)
            }
        })

        return () => {
            abort = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return state
}
