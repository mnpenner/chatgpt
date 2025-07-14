import {createGlobalState} from '../lib/global-state.ts'
import type { LegacyMessage} from '../types/openai.ts';


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
