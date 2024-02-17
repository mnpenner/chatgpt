import {useRef} from "react"


export function useNullRef<T>() {
    return useRef<T|null>(null)
}
