import {useEffect} from 'react'
import useEventHandler from './useEvent.ts'


export function useEventListener<T extends HTMLElement, K extends keyof HTMLElementEventMap>(el: T, event: K, cb: (ev: HTMLElementEventMap[K]) => void, options?: AddEventListenerOptions) {
    const fn = useEventHandler(cb)
    return useEffect(() => {
        if(el == null) return
        return addEventListener(el, event, fn, options)
    }, [el, event, fn, options])
}

export function addEventListener<T extends HTMLElement, K extends keyof HTMLElementEventMap>(el: T, event: K, cb: (ev: HTMLElementEventMap[K]) => void, options?: AddEventListenerOptions) {
    el.addEventListener(event, cb, options)
    return () => el.removeEventListener(event, cb, options)
}

const ONCE: AddEventListenerOptions = {once: true}

export function addOnceListener<T extends HTMLElement, K extends keyof HTMLElementEventMap>(el: T, event: K, cb: (ev: HTMLElementEventMap[K]) => void) {
    return addEventListener(el, event, cb, ONCE)
}
