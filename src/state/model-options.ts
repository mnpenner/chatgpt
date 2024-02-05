import {createGlobalState} from '../lib/global-state.ts'
import {localStorageGetJson, localStorageSetJson} from '../lib/local-storage.ts'

type ModelOptions = {
    model: string
    modelCategory: string
    apiKey: string
    googleMapsKey: string
    vertexAiKey: string
}

const KEY = '5ddf1280-ee98-42ad-bcb0-cf01a8d4bd79'

export const ModelState = createGlobalState<ModelOptions>({
    model: '',
    modelCategory: '',
    apiKey: '',
    googleMapsKey: '',
    vertexAiKey: '',
    ...localStorageGetJson(KEY),
})


ModelState.subscribe(value => {
    localStorageSetJson(KEY, value)
})
