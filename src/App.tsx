import {withClass} from './with-class.tsx'
import css from './chat.module.css'
import {useForm} from "react-hook-form"
import {ChatState, ResponseMessage} from './state/chat-state.ts'
import {fpMapSet, fpObjSet, fpShallowMerge} from '@mpen/imut-utils'
import {fullWide, uniqId} from './lib/misc.ts'
import {mapMap, mapObj} from './lib/collection.ts'
import useEventHandler, {useEvent} from './hooks/useEvent.ts'
import SendIcon from './assets/send.svg?react'
import {Select, TextInput, TextArea as _TextArea,type TextAreaRef, type TextAreaProps, type InputChangeEvent, type SelectChangeEvent} from '@mpen/react-basic-inputs'
import {ExternalLink} from './links.tsx'
import {ModelState} from './state/model-options.ts'
import {postSSE} from './lib/sse.ts'
import {ChatDelta, COMPLETIONS_ENDPOINT, MAX_TOKENS, Message} from './types/openai.ts'
import {Markdown} from './markdown.tsx'
import type {TiktokenModel} from "js-tiktoken"
import {getModelInfo, MODEL_OPTIONS, MODEL_W_FUNCS, OPENAI_MODEL_ALIASES, OpenAiModelId} from './lib/openai-models.ts'
import {UsageState} from './state/usage-state.ts'
import React, {useRef} from 'react'
import cc from 'classcat'
import {Accordion, Drawer} from './accordion.tsx'
import OpenAI from 'openai'
import {callTool, openaiTools} from './lib/openai-tools.ts'
import {logJson} from './lib/debug.ts'


const Page = withClass('div', css.page)
const Indent = withClass('div', css.indent)
const TopBar = withClass('div', css.topBar)
const BottomBar = withClass('div', css.bottomBar)
const ChatStack = withClass('div', css.chatStack)
const ChatBar = withClass('div', css.chatBar)
const ChatBubble = withClass('div', css.chatBubble)
const SideBar = withClass('div', css.sidebar)
const AutoTextArea = withClass<TextAreaProps,TextAreaRef>(_TextArea, css.autosizeTextarea)

type ChatMessageForm = {
    message: string
}

function RenderMessage({message:message,id:id}: {id:string,message:ResponseMessage}) {

    return (
        <ChatBubble className={message.role === 'user' ? css.user : css.assistant}>
            <div className={css.chatNameRow}>
                <span className={css.chatRole}>{message.role}</span>
                <span className={css.chatRowOptions}>
                            {message.tokenCount != null ? <span className={css.chatTokenCount}><data value={fullWide(message.tokenCount)}>{formatNumber(message.tokenCount)}</data> tokens</span> : null}
                    <label><input type="checkbox" checked={!!message.rawMarkdown} onChange={() => {
                        ChatState.setState(fpObjSet('responses',fpMapSet(id,fpObjSet('rawMarkdown',b => !b))))
                    }} /> Raw</label>
                        </span>
            </div>
            <div>
                {message.rawMarkdown ? <pre>{message.content}</pre> : <Markdown>{message.content}</Markdown>}

            </div>
        </ChatBubble>
    )
}

function MessageList() {
    const messages = Array.from(ChatState.useState(s => s.responses))

    const idx = messages.findLastIndex(([_,msg]) => msg.role === 'user')



    // last index of res.role === user

    return (
        <div className={css.chatList}>
            {idx === -1
                ? messages.map(([id,msg]) => <RenderMessage key={id} id={id} message={msg}/>) : <>

                {messages.slice(0,idx).map(([id,msg]) => <RenderMessage key={id} id={id} message={msg}/>)}
                <div className={cc([css.lastUserMessage,css.chatList])}>
                    {messages.slice(idx).map(([id,msg]) => <RenderMessage key={id} id={id} message={msg}/>)}
                </div>
            </>}
        </div>
    )
}

function appendMessage(message: Message) {
    const id = uniqId()
    ChatState.setState(fpObjSet('responses', fpMapSet(id, message)))
    return id

}

function sendMessageLegacy(model: string, message: string) {
    const info = getModelInfo(model)
    if(!info) throw new Error(`Could not get info for model "${model}"`)

    const newUserMessage: Message = {
        role: 'user',
        content: message,
    }

    const sendMessages: Message[] = [
        {
            role: 'system',
            content: "Respond using GitHub Flavored Markdown (GFM) syntax but don't tell me about Markdown or GFM unless the user explicitly asks. Write formulas, math equations and symbols using `remark-math` syntax. Large formulas should go on their own line, separated with $$ on either side; e.g.\n\n$$\nL = \\frac{1}{2} \\rho v^2 S C_L\n$$\n\nMath symbols should be written with a single $ on either side, e.g. $C_L$"
        },
        ...mapMap(ChatState.getSnapshot().responses, ({role,content}) => ({role,content})),
        newUserMessage,
    ]

    // varDump(sendMessages)

    const responseId = uniqId()

    const TiktokenPromise = import('js-tiktoken')

    // TODO: scroll this message into view so that the top aligns with the top of the window...

    const requestId = appendMessage(newUserMessage)
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

        const totalInputTokens = sendMessages.reduce((previousValue,currentValue) => {
            return previousValue + encoder.encode(currentValue.content).length
        }, 0)

        UsageState.setState(fpShallowMerge({
            usage: fpObjSet(info.id, fpShallowMerge({
                input: o => (o ?? 0) + totalInputTokens,
            })),
            cost: c => c + totalInputTokens / 1000 * info.input,
        }))

        ChatState.setState(fpObjSet('responses', fpMapSet(requestId, res => ({
            ...res!,
            tokenCount: encoder.encode(newUserMessage.content).length,
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
}

async function sendMessageWithFunctions(message: string)  {
    const openai = new OpenAI({
        apiKey: ModelState.getSnapshot().apiKey,
        dangerouslyAllowBrowser: true,
    });

    const newUserMessage: Message = {
        role: 'user',
        content: message,
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
            role: 'system',
            content: "Respond using GitHub Flavored Markdown (GFM) syntax but don't tell me about Markdown or GFM unless the user explicitly asks. Write formulas, math equations and symbols using `remark-math` syntax. Large formulas should go on their own line, separated with $$ on either side; e.g.\n\n$$\nL = \\frac{1}{2} \\rho v^2 S C_L\n$$\n\nMath symbols should be written with a single $ on either side, e.g. $C_L$"
        },
        newUserMessage,
    ]

    const userMessageId = appendMessage(newUserMessage)


    const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: messages,
        tools: openaiTools,
        tool_choice: "auto", // auto is default, but we'll be explicit
    });

    // logJson(response)

    const responseMessage = response.choices[0].message;
    // logJson(responseMessage)

    messages.push(responseMessage)

    if(responseMessage.tool_calls?.length) {
        const toolMsgs = []
        for(const toolCall of responseMessage.tool_calls) {
            toolMsgs.push(appendMessage({
                role: 'assistant',
                content: `Calling \`${toolCall.function.name}(${toolCall.function.arguments})\``,
            }))
        }

        const toolResults = await Promise.all(responseMessage.tool_calls.map(tc => callTool(tc)))

        for(let i=0; i<toolResults.length; ++i) {
            ChatState.setState(fpObjSet('responses', fpMapSet(toolMsgs[i], msg => ({
                role: 'assistant',
                ...msg,
                content: msg?.content + ' → `' + toolResults[i].content + '`',
            }))))
        }

        // logJson(toolResults)
        messages.push(...toolResults)

        const secondResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            messages: messages,
        });

        const secondMessage = secondResponse.choices[0].message;
        appendMessage(secondMessage)
    } else {
        appendMessage(responseMessage)
    }
}


function BottomForm() {
    const {register, handleSubmit, reset} = useForm<ChatMessageForm>({
        defaultValues: {
            message: '',
        }
    })

    const taRef = useRef<TextAreaRef|null>(null)

    const onSubmit = useEvent<ChatMessageForm>(data => {
        const model = ModelState.getSnapshot().model

        reset()
        taRef.current?.adjustHeight()

        if(model === MODEL_W_FUNCS) {
            sendMessageWithFunctions(data.message)
        } else {
            sendMessageLegacy(model, data.message)
        }
    })

    const doSubmit = handleSubmit(onSubmit)

    const handleKeyDown = useEvent<React.KeyboardEvent<HTMLTextAreaElement>>(event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent the default action (inserting a new line)
            doSubmit()
        }
    })

    const taProps = register("message", {required: true})

    return (
        <form onSubmit={doSubmit} className={css.chatBar}>
            <div className={css.flex1}>
                <AutoTextArea initialHeight="0" className={css.input} onKeyDown={handleKeyDown} {...taProps} ref={ref => {
                    taRef.current = ref
                    taProps.ref(ref?.element)
                }} />
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
                <Indent className={css.height100}>
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

    const keyChange = useEventHandler((ev: InputChangeEvent) => {
        ModelState.setState(fpObjSet('apiKey', ev.value))
    })

    const modelChange = useEventHandler((ev: SelectChangeEvent<string>) => {
        ModelState.setState(fpObjSet('model', ev.value))
    })

    return (
        <SideBar>
            <div className={css.sidebarIndent}>
                <button onClick={() => {
                    ChatState.setState(fpObjSet('responses', new Map))
                }}>New Chat
                </button>
                {/*<button>Settings</button>*/}
            </div>

            <Accordion>
                <Drawer title="API Key">
                    <label>
                        <TextInput value={state.apiKey} onChange={keyChange} className={css.apiKeyInput} />
                    </label>
                    <div>
                        <ExternalLink href="https://platform.openai.com/api-keys">Get Key</ExternalLink>
                        {' | '}
                        <ExternalLink href="https://platform.openai.com/usage">Usage</ExternalLink>
                    </div>
                </Drawer>
                <Drawer title="Model">
                    <label>
                        <Select options={MODEL_OPTIONS} value={state.model} onChange={modelChange} />
                    </label>
                    {state.model ? <ModelInfoTable model={state.model} /> : null}

                </Drawer>
                <Drawer title="Usage">
                    <ShowUsage />
                </Drawer>
            </Accordion>
        </SideBar>
    )
}

function Price({value}: { value: number }) {
    return <data value={fullWide(value)}>{formatPrice(value)}</data>
}

function ShowUsage() {
    const state = UsageState.useState()
    return (
        <div>
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
                <b>Total Cost:</b> <Price value={state.cost}/>
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
                    <td><Price value={info.input}/> / 1k tokens</td>
                </tr>
                <tr>
                    <th>Output</th>
                    <td><Price value={info.output}/> / 1k tokens</td>
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

