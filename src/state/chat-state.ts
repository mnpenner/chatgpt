import {createGlobalState} from '../lib/global-state.ts'
import {Message} from '../types/openai.ts'
import {jsonStringify} from '../lib/json.ts'

export interface ResponseMessage extends Message {
    // context: boolean
}

type ChatStateType = {
    responses: Map<string,ResponseMessage>
    // runningCost: number
}

export const ChatState = createGlobalState<ChatStateType>({
    responses: new Map,
})
