import {createGlobalState} from '../lib/global-state.ts'
import {Message} from '../types/openai.ts'

export interface ResponseMessage extends Message {
    tokenCount?: number
}

type ChatStateType = {
    responses: Map<string,ResponseMessage>
    // runningCost: number
}

export const ChatState = createGlobalState<ChatStateType>({
    responses: new Map,
})
