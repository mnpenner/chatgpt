// https://openai.com/pricing
// https://platform.openai.com/docs/models/overview


import {mapMap, mapObj} from './collection.ts'

export type OpenAiModelId = string|import('js-tiktoken').TiktokenModel
import type {SelectOption} from '@mpen/react-basic-inputs'

export type OpenAiModelInfo = {
    id: string
    /** Price per 1K tokens in USD */
    input: number
    output: number
    contextWindow: number
    aliases: OpenAiModelId[]
    legacy?: boolean
    recommended?: string
    /**
     * @see https://platform.openai.com/docs/guides/function-calling
     */
    supportsFunctions?: boolean
}

export const OPENAI_MODEL_ALIASES: Record<OpenAiModelId,OpenAiModelId> = {
    'gpt-4-turbo-preview': 'gpt-4-0125-preview',
    'gpt-4-32k': 'gpt-4-32k-0613',
    'gpt-4': 'gpt-4-0613',
    'gpt-3.5-turbo': 'gpt-3.5-turbo-0613',
    'gpt-3.5-turbo-16k': 'gpt-3.5-turbo-16k-0613',
}

const OPENAI_PRICE_TABLE = (() => {
    const table: Record<OpenAiModelId,Partial<OpenAiModelInfo>> = {
        'gpt-4-0125-preview' : {
            input: 0.01,
            output: 0.03,
            contextWindow: 128_000,
            supportsFunctions: true,
        },
        'gpt-4-1106-preview' : {
            input: 0.01,
            output: 0.03,
            contextWindow: 128_000,
        },
        'gpt-4-1106-vision-preview' : {
            input: 0.01,
            output: 0.03,
            contextWindow: 128_000,
        },
        'gpt-4-0613' : {
            input: 0.03,
            output: 0.06,
            contextWindow: 8_192,
        },
        'gpt-4-32k-0613' : {
            input: 0.06,
            output: 0.12,
            contextWindow: 32_768,
        },
        'gpt-3.5-turbo-1106' : {
            input: 0.0010,
            output: 0.0020,
            contextWindow: 16_385,
        },
        'gpt-3.5-turbo-instruct' : {
            input: 0.0015,
            output: 0.0020,
            contextWindow: 4_096,
        },
        // https://platform.openai.com/docs/deprecations/2023-11-06-chat-model-updates
        'gpt-3.5-turbo-0613' : {
            input: 0.0015,
            output: 0.0020,
            contextWindow: 4_096,
            legacy: true,
            recommended: 'gpt-3.5-turbo-1106',
            supportsFunctions: true,
        },
        'gpt-3.5-turbo-16k-0613' : {
            input: 0.0030,
            output: 0.0040,
            contextWindow: 16_385,
            legacy: true,
            recommended: 'gpt-3.5-turbo-1106',
        },
    }

    for(const [k,v] of Object.entries(table)) {
        v.id = k
        v.aliases = []
    }
    for(const [k,v] of Object.entries(OPENAI_MODEL_ALIASES)) {
        table[v].aliases!.push(k)
    }

    return table as Record<OpenAiModelId, OpenAiModelInfo>
})()


export function getModelInfo(model: OpenAiModelId): OpenAiModelInfo|undefined {
    return OPENAI_PRICE_TABLE[OPENAI_MODEL_ALIASES[model] ?? model]
}

export const MODEL_W_FUNCS = '5db87e95-7302-4052-8ad3-cbd75bb6d109'

type ModelCategory = {
    text: string,
    disabled?: boolean
}

const MODEL_CATEGORIES = new Map<string,ModelCategory>([
    ['openai-chatgpt', {text: "OpenAI ChatGPT"}],
    ['openai-functions', {text: "ChatGPT w/ Functions"}],
    ['openai-image', {text: "OpenAI Image"}],
    ['vertex-ai', {text: "Google Vertex AI"}],
])

export const modelCategoryOptions = mapMap(MODEL_CATEGORIES, (val,key) => ({
    text: val.text,
    disabled: val.disabled,
    value: key,
}))

export const MODEL_OPTIONS = (() => {
    const options: SelectOption<string>[]  = []
    for(const model of Object.keys(OPENAI_MODEL_ALIASES).sort()) {
        options.push({
            text: model,
            // text: `${model} → ${OPENAI_MODEL_ALIASES[model]}`,
            value: model,
        })
    }
    options.push({
        text: '---',
        disabled: true,
        value: '',
    })
    for(const model of Object.keys(OPENAI_PRICE_TABLE).sort()) {
        const info = OPENAI_PRICE_TABLE[model]
        let name = model
        if(info.contextWindow != null) {
            name += ` (${Math.round(info.contextWindow/1024)}k)`;
        }
        options.push({
            text: name,
            value: model,
        })
    }
    // options.push({
    //     text: '---',
    //     disabled: true,
    //     value: '',
    // })
    // options.push({
    //     text: '3.5 w/ functions',
    //     value: MODEL_W_FUNCS,
    // })

    return options
})()

export const SUB_OPTIONS = new Map([
    ['openai-chatgpt', MODEL_OPTIONS],
    ['openai-functions', Array.from(Object.entries(OPENAI_PRICE_TABLE)).filter(([key,val]) => val.supportsFunctions).map(([key,val]) => ({
        text: key,
        value: key,
    }))],
    // ['openai-functions', [
    //     {value: MODEL_W_FUNCS, text: 'Dunno'},
    // ]],
    ['openai-image', [
        {value: 'dall-e-3', text: 'DALL·E 3'},
        {value: 'dall-e-2', text: 'DALL·E 2'},
    ]],
    ['vertex-ai', [
        // https://ai.google.dev/models/gemini
        {value: 'models/gemini-pro', text: 'Gemini Pro'},
    ]],
])
