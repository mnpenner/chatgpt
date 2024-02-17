import {AnyFn} from '../types/util-types.ts'
import {useEffect} from 'react'
import {useEvent} from 'react-use'
import useEventHandler from './useEvent.ts'


export function useEventListener<T extends HTMLElement, K extends keyof HTMLElementEventMap>(el: T, event: K, cb: (ev: HTMLElementEventMap[K])=>void, options?: AddEventListenerOptions) {
    const fn = useEventHandler(cb)
    return useEffect(() => {
        if(el == null) return
        el.addEventListener(event, fn, options)
        return () => el.removeEventListener(event, fn, options)
    }, [el, event, fn, options])
}
