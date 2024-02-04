import {useDebugValue, useState} from 'react'
import {uniqId} from '../lib/misc.ts'


export function useStableId() {
    const id = useState(() => uniqId())[0]
    useDebugValue(id)
    return id
}
