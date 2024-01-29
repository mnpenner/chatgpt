import {createGlobalState} from '../lib/global-state.ts'
import {localStorageGetJson, localStorageSetJson} from '../lib/local-storage.ts'
import {OpenAiModelId} from '../lib/openai-models.ts'

type UsageType = {
    input: number
    output: number
}

type UsageState = {
    usage: Record<OpenAiModelId,UsageType>
    cost: number
}

const STORAGE_KEY = '48849516-afd1-4c5f-8dd4-a6135d0b972e'

export const UsageState = createGlobalState<UsageState>({
    usage: {},
    cost: 0,
    ...localStorageGetJson(STORAGE_KEY),
})


UsageState.subscribe(value => {
    localStorageSetJson(STORAGE_KEY, value)
})
