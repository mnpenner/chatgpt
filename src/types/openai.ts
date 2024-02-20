import {EmptyObject, XOR} from './util-types.ts'
import type OpenAI from 'openai'
import type OpenAI from 'openai'

export type ChatDelta = {
    id: string;
    object: string;
    created: number;
    model: string
    system_fingerprint: null
    choices: Choice[];
}

export type Choice = {
    index: 0
    logprobs: null
} & XOR<{
    delta: {
        content: string
    }
    finish_reason: null
} | {
    delta: EmptyObject
    finish_reason: 'stop'
}>

// https://platform.openai.com/docs/guides/text-generation/chat-completions-api
// export type Message =  OpenAI.Chat.Completions.ChatCompletionMessage

export const enum Role {
    System = 'system',
    User = 'user',
    Assistant = 'assistant',
}

export const enum MessageType {
    OpenAiThreadMessage,
}


export type OaiThreadMessageContentItem = OpenAI.Beta.Threads.ThreadMessage['content'][number]
export type OaiThreadMessageContent = OpenAI.Beta.Threads.ThreadMessage['content']

export type OaiThreadMessage = OpenAI.Beta.Threads.ThreadMessage & {
    $type: MessageType.OpenAiThreadMessage
}

export type LegacyMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string|null;
}

export type AnyMessage = LegacyMessage | OaiThreadMessage



export type Usage = {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export const COMPLETIONS_ENDPOINT = 'https://api.openai.com/v1/chat/completions'
export const MAX_TOKENS = 1000
