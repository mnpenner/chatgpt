import {withClass} from './with-class.tsx'
import css from './chat.module.css'
import {useForm} from "react-hook-form"
import {ChatState} from './state/chat-state.ts'
import {fpMapSet} from '@mpen/imut-utils'
import {uniqId} from './lib/misc.ts'
import {mapMap} from './lib/collection.ts'
import useEvent from './hooks/useEvent.ts'
import SendIcon from './assets/send.svg?react'
import {Select, TextInput, type InputChangeEvent, type SelectChangeEvent} from '@mpen/react-basic-inputs'
import {ExternalLink} from './links.tsx'
import {ModelState} from './state/model-options.ts'
import {logJson} from './lib/debug.ts'
import {postSSE} from './lib/sse.ts'
import {ChatDelta, COMPLETIONS_ENDPOINT, MAX_TOKENS, Message} from './types/openai.ts'
import {useState} from 'react'
import {Markdown} from './markdown.tsx'
import type {TiktokenModel} from "js-tiktoken"
import {getModelInfo, MODEL_OPTIONS, OPENAI_MODEL_ALIASES, OpenAiModelId} from './lib/openai-models.ts'



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
                    <div>{res.role}</div>
                    <Markdown>{res.content}</Markdown>
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
        reset()

        const sendMessages: Message[] = [
            {role: 'system', content: "Respond using GitHub Flavored Markdown syntax where appropriate."},
            {role: 'user', content: data.message},
        ]

        const responseId = uniqId()
        const model = ModelState.getSnapshot().model
        const Tiktoken = import('js-tiktoken')

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
                ChatState.set('responses', fpMapSet(responseId, oldMsg => (
                    oldMsg ? {
                        ...oldMsg,
                        content: oldMsg.content + firstChoice.delta.content
                    } : {
                        role: 'assistant',
                        content: firstChoice.delta.content,
                    })))
            },
            onFinish: async () => {
                const {encodingForModel} = await Tiktoken
                const encoder = encodingForModel(model as TiktokenModel)
                const fullMessage = ChatState.getSnapshot().responses.get(responseId)!
                console.log(encoder.encode(fullMessage.content))
            }
        })

        ChatState.setState(currentState => {
            const newResponses = new Map(currentState.responses)
            newResponses.set(uniqId(), {
                role: 'user',
                content: data.message,
            })
            return {
                ...currentState,
                responses: newResponses,
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
    });

    return formatter.format(value);
}

function formatNumber(value: number): string {
    const formatter = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 4,
    });

    return formatter.format(value);
}

function SideBarContents() {
    const state = ModelState.useState()

    const keyChange = useEvent((ev: InputChangeEvent) => {
        ModelState.set('apiKey', ev.value)
    })

    const modelChange = useEvent((ev: SelectChangeEvent<string>) => {
        ModelState.set('model', ev.value)
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
                {state.model ? <ModelInfoTable model={state.model}/> : null}
            </div>
        </SideBar>
    )
}

type ModelInfoTableProps = {model: OpenAiModelId}
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

