import SyncOpenAI from 'openai'
import {ModelState} from '../state/model-state.ts'

/**
 * @deprecated
 */
export function getOpenAiSync() {
    return new SyncOpenAI({
        apiKey: ModelState.getSnapshot().apiKey,
        dangerouslyAllowBrowser: true,
    })
}


export async function getOpenAi() {
    const {default: OpenAI} = await import('openai')

    return new OpenAI({
        apiKey: ModelState.getSnapshot().apiKey,
        dangerouslyAllowBrowser: true,
    })
}
