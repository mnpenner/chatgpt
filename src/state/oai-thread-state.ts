import {createGlobalState} from '../lib/global-state.ts'
import type OpenAI from 'openai'
import {localStorageGetJson, localStorageSetJson} from '../lib/local-storage.ts'


const KEY = 'd0a65faf-e47f-4ef8-8340-8c24e2bb2b67'

export const OaiThreadState = createGlobalState<OpenAI.Beta.Threads.Thread[]>(localStorageGetJson(KEY,[]))


OaiThreadState.subscribe(value => {
    localStorageSetJson(KEY, value)
})
