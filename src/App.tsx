import {withClass} from './with-class.tsx'
import css from './chat.module.css'
import {useForm} from "react-hook-form"
import {ChatState} from './state/chat-state.ts'
import {fpMapSet, fpObjSet, fpShallowMerge} from '@mpen/imut-utils'
import {fullWide, uniqId} from './lib/misc.ts'
import {mapMap, mapObj} from './lib/collection.ts'
import useEvent from './hooks/useEvent.ts'
import SendIcon from './assets/send.svg?react'
import {Select, TextInput, type InputChangeEvent, type SelectChangeEvent} from '@mpen/react-basic-inputs'
import {ExternalLink} from './links.tsx'
import {ModelState} from './state/model-options.ts'
import {logJson, varDump} from './lib/debug.ts'
import {postSSE} from './lib/sse.ts'
import {ChatDelta, COMPLETIONS_ENDPOINT, MAX_TOKENS, Message} from './types/openai.ts'
import {useState} from 'react'
import {Markdown} from './markdown.tsx'
import type {TiktokenModel} from "js-tiktoken"
import {getModelInfo, MODEL_OPTIONS, OPENAI_MODEL_ALIASES, OpenAiModelId} from './lib/openai-models.ts'
import {UsageState} from './state/usage-state.ts'

import {jsonStringify} from './lib/json-serialize.ts'


const Page = withClass('div', css.page)
const Indent = withClass('div', css.indent)
const TopBar = withClass('div', css.topBar)
const BottomBar = withClass('div', css.bottomBar)
const ChatStack = withClass('div', css.chatStack)
const ChatBar = withClass('div', css.chatBar)
const ChatBubble = withClass('li', css.chatBubble)
const SideBar = withClass('div', css.sidebar)

type ChatMessageForm = {
    message: string
}

function MessageList() {
    const messages = ChatState.useState(s => s.responses)

    return (
        <ol className={css.chatList}>
            {mapMap(messages, (res, key) => (
                <ChatBubble className={res.role === 'user' ? css.user : css.assistant}
                    key={key}>
                    <div className={css.chatNameRow}>
                        <span className={css.chatRole}>{res.role}</span>
                        {res.tokenCount != null ? <span className={css.chatTokenCount}><data value={fullWide(res.tokenCount)}>{formatNumber(res.tokenCount)}</data> tokens</span> : null}
                    </div>
                    <div>
                        <Markdown>{res.content}</Markdown>
                    </div>
                </ChatBubble>
            ))}
        </ol>
    )
}

function BottomForm() {
    const {register, handleSubmit, reset} = useForm<ChatMessageForm>({
        defaultValues: {
            message: '',
        }
    })

    const onSubmit = useEvent((data: ChatMessageForm) => {
        const model = ModelState.getSnapshot().model
        const info = getModelInfo(model)
        if(!info) throw new Error(`Could not get info for model "${model}"`)

        reset()

        const newUserMessage: Message = {
            role: 'user',
            content: data.message,
        }

        const sendMessages: Message[] = [
            {
                role: 'system',
                content: "Respond using GitHub Flavored Markdown (GFM) syntax but don't tell me about Markdown or GFM unless the user explicitly asks."
            },
            ...mapMap(ChatState.getSnapshot().responses, ({role,content}) => ({role,content})),
            newUserMessage,
        ]

        // varDump(sendMessages)

        const requestId = uniqId()
        const responseId = uniqId()

        const TiktokenPromise = import('js-tiktoken')

        // TODO: scroll this message into view so that the top aligns with the top of the window...

        ChatState.setState(fpObjSet('responses', fpMapSet(requestId, newUserMessage)))
        // ChatState.setState(currentState => {
        //     const newResponses = new Map(currentState.responses)
        //     newResponses.set(requestId, newUserMessage)
        //     return {
        //         ...currentState,
        //         responses: newResponses,
        //     }
        // })

        TiktokenPromise.then(({encodingForModel}) => {
            const encoder = encodingForModel(model as TiktokenModel)
            // const tokensUsed = encoder.encode(data.message).length

            const tokensUsed = sendMessages.reduce((previousValue,currentValue) => {
                return previousValue + encoder.encode(currentValue.content).length
            }, 0)

            UsageState.setState(fpShallowMerge({
                usage: fpObjSet(info.id, fpShallowMerge({
                    input: o => (o ?? 0) + tokensUsed,
                })),
                cost: c => c + tokensUsed / 1000 * info.input,
            }))

            ChatState.setState(fpObjSet('responses', fpMapSet(requestId, res => ({
                ...res!,
                tokenCount: tokensUsed,
            }))))
        })

        postSSE({
            url: COMPLETIONS_ENDPOINT,
            bearerToken: ModelState.getSnapshot().apiKey,
            body: {
                model: model,
                messages: sendMessages,
                stream: true,
                top_p: 0.1,
                max_tokens: MAX_TOKENS,
            },
            onMessage: ({data}: { data: ChatDelta }) => {
                if(!data.choices?.length) return
                const firstChoice = data.choices[0]
                if(firstChoice.finish_reason != null) return
                ChatState.setState(fpObjSet('responses', fpMapSet(responseId, res => (
                    res ? {
                        ...res,
                        content: res.content + firstChoice.delta.content
                    } : {
                        role: 'assistant',
                        content: firstChoice.delta.content,
                    }))))
            },
            onFinish: () => {
                // console.log('finish')
                TiktokenPromise.then(({encodingForModel}) => {
                    const encoder = encodingForModel(model as TiktokenModel)
                    const fullMessage = ChatState.getSnapshot().responses.get(responseId)!
                    const tokensUsed = encoder.encode(fullMessage.content).length
                    // console.log('settting')
                    ChatState.setState(fpObjSet('responses', fpMapSet(responseId, res => ({
                            ...res!,
                            tokenCount: tokensUsed
                        }
                    ))))
                    UsageState.setState(fpShallowMerge({
                        usage: fpObjSet(info.id, fpShallowMerge({
                            output: o => (o ?? 0) + tokensUsed,
                        })),
                        cost: c => c + tokensUsed / 1000 * info.output,
                    }))
                })
            }
        })
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={css.chatBar}>
            <div className={css.flex1}>
                <input className={css.input} {...register("message", {required: true})} />
            </div>
            <button type="submit" className={css.imageButton}>
                <SendIcon />
            </button>
        </form>
    )
}

function ChatContents() {

    return (
        <ChatStack>
            <TopBar>
                <Indent>
                    <MessageList />
                </Indent>
            </TopBar>
            <BottomBar>
                <Indent>
                    <BottomForm />
                </Indent>
            </BottomBar>
        </ChatStack>
    )
}

function formatPrice(value: number): string {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    })

    return formatter.format(value)
}

function formatNumber(value: number): string {
    const formatter = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 4,
    })

    return formatter.format(value)
}

function SideBarContents() {
    const state = ModelState.useState()

    const keyChange = useEvent((ev: InputChangeEvent) => {
        ModelState.setState(fpObjSet('apiKey', ev.value))
    })

    const modelChange = useEvent((ev: SelectChangeEvent<string>) => {
        ModelState.setState(fpObjSet('model', ev.value))
    })

    return (
        <SideBar>
            <div>
                <button>New Chat</button>
                <button>Settings</button>
            </div>
            <div>
                <label>
                    <span>API Key</span>
                    <TextInput value={state.apiKey} onChange={keyChange} className={css.apiKeyInput} />
                </label>
                <div>
                    <ExternalLink href="https://platform.openai.com/api-keys">Get Key</ExternalLink>
                    <ExternalLink href="https://platform.openai.com/usage">Usage</ExternalLink>
                </div>
            </div>
            <div>
                <label>
                    <span>Model</span>
                    <Select options={MODEL_OPTIONS} value={state.model} onChange={modelChange} />
                </label>
                {state.model ? <ModelInfoTable model={state.model} /> : null}
            </div>
            <ShowUsage />
        </SideBar>
    )
}

function ShowUsage() {
    const state = UsageState.useState()
    return (
        <div>
            <h3>Usage</h3>
            <table>
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Input</th>
                        <th>Output</th>
                    </tr>
                </thead>
                <tbody>
                    {mapObj(state.usage, (v, k) => <tr key={k}>
                        <td>{k}</td>
                        <td>{formatNumber(v.input)}</td>
                        <td>{formatNumber(v.output)}</td>
                    </tr>)}
                </tbody>
            </table>
            <div>
                Total Cost: <data value={fullWide(state.cost)}>{formatPrice(state.cost)}</data>
            </div>
        </div>
    )
}

type ModelInfoTableProps = { model: OpenAiModelId }

function ModelInfoTable({model}: ModelInfoTableProps) {
    const info = getModelInfo(model)
    if(!info) return null
    const aliasOf = OPENAI_MODEL_ALIASES[model]
    return (
        <table>
            <tbody>
                {aliasOf ? <tr>
                    <th>Alias Of</th>
                    <td><code>{aliasOf}</code></td>
                </tr> : null}
                <tr>
                    <th>Input</th>
                    <td>{formatPrice(info.input)} / 1k tokens</td>
                </tr>
                <tr>
                    <th>Output</th>
                    <td>{formatPrice(info.output)} / 1k tokens</td>
                </tr>
                {info.contextWindow ? <tr>
                    <th>Context</th>
                    <td>{formatNumber(info.contextWindow)}</td>
                </tr> : null}

            </tbody>
        </table>
    )
}

export default function App() {


    return (
        <Page>
            <SideBarContents />
            <ChatContents />
        </Page>
    )
}

