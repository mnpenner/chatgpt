import {createGlobalState} from '../lib/global-state.ts'
import {AnyMessage, LegacyMessage, OaiThreadMessage} from '../types/openai.ts'
import type OpenAI from 'openai'


export type MessageMetadata = {
    tokenCount?: number
    rawMarkdown?: boolean
    inProgress?: boolean
}


export type RenderableMessage =
    | (MessageMetadata & LegacyMessage)
    // | (MessageMetadata & {message: OaiThreadMessage})





type ChatStateType = {
    responses: Map<string,RenderableMessage>
    // runningCost: number
}

export const ChatState = createGlobalState<ChatStateType>({
    responses: new Map,
})
