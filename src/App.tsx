import {withClass} from './with-class.tsx'
import css from './chat.module.css'
import {useForm} from "react-hook-form"
import {ChatState, MessageType, RenderableMessage} from './state/chat-state.ts'
import {fpMapSet, fpMapUpdate, fpObjSet, fpShallowMerge} from '@mpen/imut-utils'
import {fullWide, sleep, uniqId} from './lib/misc.ts'
import {mapMap, mapObj} from './lib/collection.ts'
import useEventHandler, {useEvent} from './hooks/useEvent.ts'
import SendIcon from './assets/send.svg?react'
import {
    useQuery,
    useMutation,
    useQueryClient,
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import NewChatIcon from './assets/comment-medical.svg?react'
import {
    type InputChangeEvent,
    RadioMenu,
    Select,
    type SelectChangeEvent,
    TextArea as _TextArea,
    type TextAreaProps,
    type TextAreaRef,
    TextInput
} from '@mpen/react-basic-inputs'
import {ActionLink, ExternalLink} from './links.tsx'
import {ModelState} from './state/model-state.ts'
import {postSSE} from './lib/sse.ts'
import {
    ChatDelta,
    COMPLETIONS_ENDPOINT,
    MAX_TOKENS,
    LegacyMessage,
    Role,
    OaiThreadMessageContent, OaiThreadMessageContentItem
} from './types/openai.ts'
import {Markdown} from './markdown.tsx'
import type {TiktokenModel} from "js-tiktoken"
import {
    getModelInfo,
    modelCategoryOptions,
    OPENAI_MODEL_ALIASES,
    OpenAiModelId,
    SUB_OPTIONS
} from './lib/openai-models.ts'
import {UsageState} from './state/usage-state.ts'
import React, {FC, useRef} from 'react'
import cc from 'classcat'
import {Accordion, Drawer} from './accordion.tsx'
import OpenAI from 'openai'
import {callTool, openaiTools} from './lib/openai-tools.ts'
import type {GenerationConfig, SafetySetting} from '@google/generative-ai'
import {SidebarState} from './state/sidebar-state.ts'
import {useEventListener} from './hooks/useEventListener.ts'
import {refContains} from './lib/react.ts'
import {useNullRef} from './hooks/useNullRef.ts'
import {IconButton} from './button.tsx'
import {getOpenAi, getOpenAiSync} from './lib/openai.ts'
import {queryClient} from './lib/query-client.ts'
import {AssistantList} from './assistants.tsx'
import {Override} from './types/util-types.ts'


const Page = withClass('div', css.page)
const Indent = withClass('div', css.indent)
const TopBar = withClass('div', css.topBar)
const BottomBar = withClass('div', css.bottomBar)
const ChatStack = withClass('div', css.chatStack)
const ChatBubble = withClass('div', css.chatBubble)
const AutoTextArea = withClass<TextAreaProps, TextAreaRef>(_TextArea, css.autosizeTextarea)

type ChatMessageForm = {
    message: string
}

const TypingDots: FC = () => <span className={css.jumpingDots}>
    <span className={cc([css.jumpingDot, css.dot1])}>.</span>
    <span className={cc([css.jumpingDot, css.dot2])}>.</span>
    <span className={cc([css.jumpingDot, css.dot3])}>.</span>
</span>

// const MessageContent: FC<RenderableMessage> = msg => {
// }

function RenderMessage({message: message, id: id}: { id: string, message: RenderableMessage }) {

    return (
        <div className={cc([css.chatMessageContainer, message.role === 'user' ? css.user : css.assistant])}>
            <div className={css.chatNameRow}>
                <span className={css.chatRole}>{message.role === Role.User ? "You" : "Amigo"}</span>
                <span className={css.chatRowOptions}>
                        {message.tokenCount != null
                            ? <span className={css.chatTokenCount}><data value={fullWide(message.tokenCount)}>{formatNumber(message.tokenCount)}</data> tokens</span>
                            : null
                        }
                    <label><input type="checkbox" checked={!!message.rawMarkdown} onChange={() => {
                        ChatState.setState(fpObjSet('responses', fpMapUpdate(id, fpObjSet('rawMarkdown', b => !b))))
                    }} /> Raw</label>
                    </span>
            </div>
            <div className={cc([css.chatBubble])}>
                {message.rawMarkdown ? <pre>{message.content}</pre> : <Markdown>{message.content}</Markdown>}
                {message.inProgress ? <TypingDots/> : null}
            </div>
        </div>
    )
}

function MessageList() {
    const messages = Array.from(ChatState.useState(s => s.responses))

    const idx = messages.findLastIndex(([_, msg]) => msg.role === 'user')


    // last index of res.role === user

    return (
        <>
            {idx === -1
                ? <div className={css.chatList}>{messages.map(([id, msg]) => <RenderMessage key={id}
                    id={id}
                    message={msg} />)}</div> :
                <>
                    <div className={css.chatList}>{messages.slice(0, idx).map(([id, msg]) => <RenderMessage key={id}
                        id={id}
                        message={msg} />)}</div>
                    <div className={cc([css.lastUserMessage, css.chatList])}>
                        {messages.slice(idx).map(([id, msg]) => <RenderMessage key={id} id={id} message={msg} />)}
                    </div>
                </>}
        </>
    )
}

function appendMessage(message: LegacyMessage) {
    const id = uniqId()
    ChatState.setState(fpObjSet('responses', fpMapSet(id, message)))
    return id

}

function sendMessageLegacy(model: string, message: string) {
    const info = getModelInfo(model)
    if(!info) throw new Error(`Could not get info for model "${model}"`)

    const newUserMessage: LegacyMessage = {
        role: 'user',
        content: message,
    }

    const sendMessages: LegacyMessage[] = [
        {
            role: 'system',
            content: "Respond using GitHub Flavored Markdown (GFM) syntax but don't tell me about Markdown or GFM unless the user explicitly asks. Write formulas, math equations and symbols using `remark-math` syntax. Large formulas should go on their own line, separated with $$ on either side; e.g.\n\n$$\nL = \\frac{1}{2} \\rho v^2 S C_L\n$$\n\nMath symbols should be written with a single $ on either side, e.g. $C_L$"
        },
        ...mapMap(ChatState.getSnapshot().responses, ({role, content}) => ({role, content})),
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

        const totalInputTokens = sendMessages.reduce((previousValue, currentValue) => {
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

async function getGoogGenAi() {
    const apiKey = ModelState.getSnapshot().googleMapsKey
    const {GoogleGenerativeAI} = await import('@google/generative-ai')
    return new GoogleGenerativeAI(apiKey)
}

async function sendMessageWithFunctions(model: string, message: string) {
    const openai = getOpenAiSync()

    const newUserMessage: LegacyMessage = {
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
        model: model,
        messages: messages,
        tools: openaiTools,
        tool_choice: "auto", // auto is default, but we'll be explicit
    })

    // logJson(response)

    const responseMessage = response.choices[0].message
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

        for(let i = 0; i < toolResults.length; ++i) {
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
        })

        const secondMessage = secondResponse.choices[0].message
        appendMessage(secondMessage)
    } else {
        appendMessage(responseMessage)
    }
}


async function generateImage(model: string, prompt: string) {
    const openai = getOpenAiSync()

    appendMessage({
        role: 'user',
        content: prompt,
    })

    try {
        const response = await openai.images.generate({
            model: model,
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        })

        const responseContent = response.data.map(item => `![${prompt}](${item.url})`).join('\n')

        appendMessage({
            role: 'assistant',
            content: responseContent,
        })
    } catch(err) {
        appendMessage({
            role: 'assistant',
            content: String(err),
        })
    }


    // ChatState.setState(fpObjSet('responses', fpMapSet(id, msg => ({
    //     role: 'assistant',
    //     ...msg,
    //     content: response.data.map(item => `![${prompt}](${item.url})`).join('\n'),
    // }))))

    // appendMessage({
    //     role: 'assistant',
    //     content: response.data.map(item => `![${prompt}](${item.url})`).join('\n'),
    // })
}

function waitForRun(run: OpenAI.Beta.Threads.Runs.Run) {
    return waitForRunById(run.thread_id, run.id)
}

type CompletedRun = OpenAI.Beta.Threads.Runs.Run & {
    completed_at: Exclude<OpenAI.Beta.Threads.Runs.Run['completed_at'], null>
}

async function waitForRunById(threadId: string, runId: string) {

    const openai = await getOpenAi()

    await sleep(500)
    for(;;) {
        const run = await openai.beta.threads.runs.retrieve(threadId, runId);
        if(run.status === 'queued' || run.status === 'in_progress') {
            await sleep(50)
            continue
        }
        if(run.status === 'completed') return run as CompletedRun
        throw run
    }
}

function flattenOaiContentItem(item: OaiThreadMessageContentItem) {
    switch(item.type) {
        case 'text':
            return item.text.value
        default:
            throw new Error(`Not implemented: ${item.type}`)
    }
}

function flattenOaiContent(content: OaiThreadMessageContent) {
    return content.map(i => flattenOaiContentItem(i)).join('')
}

async function oaiAssistantMessage(assistantId: string, message: string) {


    const userMsgId = appendMessage({
        role: Role.User,
        content: message,
    })

    const amigoMsgId = uniqId()
    ChatState.setState(fpObjSet('responses', fpMapSet(amigoMsgId, {
        role: Role.Assistant,
        inProgress: true,
        content: '',
    })))

    const openai = await getOpenAi()


    const run =  await waitForRun(await openai.beta.threads.createAndRun({
        assistant_id: assistantId,
        thread: {
            messages: [
                { role: "user", content: message },
            ],
        },
    }))

    const messagesPage = await openai.beta.threads.messages.list(run.thread_id, {
        order: 'asc',
        limit: 100,
    });

    ChatState.setState(fpObjSet('responses', new Map(messagesPage.data.map(msg => [msg.id,{
        role: msg.role,
        content: flattenOaiContent(msg.content),
    } satisfies RenderableMessage]))))
}

async function googGenAiGo(modelName: string, message: string) {
    appendMessage({
        role: 'user',
        content: message,
    })

    const genAi = await getGoogGenAi()
    const model = genAi.getGenerativeModel({model: modelName})

    const generationConfig: GenerationConfig = {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
    }

    const safetySettings: SafetySetting[] = []

    const parts = [
        {text: message},
    ]

    // TODO: switch to startChat (https://makersuite.google.com/app/prompts/new_chat)
    const result = await model.generateContent({
        contents: [{role: "user", parts}],
        generationConfig,
        safetySettings,
    })

    console.log('result', result)

    appendMessage({
        role: 'assistant',
        content: result.response.text(),
    })
}

function BottomForm() {
    const {register, handleSubmit, reset} = useForm<ChatMessageForm>({
        defaultValues: {
            message: '',
        }
    })

    const taRef = useRef<TextAreaRef | null>(null)

    const onSubmit = useEvent<ChatMessageForm>(data => {

        const assistantId = ModelState.getSnapshot().assistantId

        reset()
        taRef.current?.adjustHeight()

        if(assistantId) {
            oaiAssistantMessage(assistantId, data.message)
        } else {
            const model = ModelState.getSnapshot().model
            const category = ModelState.getSnapshot().modelCategory
            switch(category) {
                case 'openai-chatgpt':
                    sendMessageLegacy(model, data.message)
                    break
                case 'openai-functions':
                    sendMessageWithFunctions(model, data.message)
                    break
                case 'openai-image':
                    generateImage(model, data.message)
                    break
                case 'vertex-ai':
                    googGenAiGo(model, data.message)
                    break
                default:
                    alert("Unimplemented")
                    break
            }
        }
    })

    const doSubmit = handleSubmit(onSubmit)

    const handleKeyDown = useEvent<React.KeyboardEvent<HTMLTextAreaElement>>(event => {
        if(event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault() // Prevent the default action (inserting a new line)
            doSubmit()
        }
    })

    const taProps = register("message", {required: true})

    return (
        <form onSubmit={doSubmit} className={css.chatBar}>
            <div className={css.flex1}>
                <AutoTextArea initialHeight="0"
                    className={css.input}
                    onKeyDown={handleKeyDown} {...taProps}
                    ref={ref => {
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

    const modelOptions = SUB_OPTIONS.get(state.modelCategory)

    const sidebarRef = useNullRef<HTMLDivElement>()
    const floaterRef = useNullRef<HTMLDivElement>()

    useEventListener(document.body, 'mousedown', el => {
        if(window.innerWidth > 799) return // must match chat.module.css floaty thing
        const clicked = el.target as HTMLElement
        // console.log(sidebarRef.current?.contains(clicked), refContains(floaterRef,clicked))
        if(refContains(sidebarRef, clicked) || refContains(floaterRef, clicked)) return

        // console.log(clicked,sidebarRef.current,floaterRef.current,clicked.contains(floaterRef.current))
        // if(clicked.contains(sidebarRef.current) || clicked.contains(floaterRef.current)) return

        // if(el.target.con)
        SidebarState.setState(fpObjSet('open', false))
    })

    const sideBarOpen = SidebarState.useState(s => s.open)

    if(!sideBarOpen) {
        return (
            <div className={css.floater} ref={floaterRef}>
                <button onClick={() => {
                    SidebarState.setState(fpObjSet('open', true))
                }}>=
                </button>
            </div>
        )
    }


    return (
        <div className={css.sidebar} ref={sidebarRef}>
            <div className={css.sidebarIndent}>
                <div className={css.spaceBetween}>
                    <div>
                        <button onClick={() => {
                            SidebarState.setState(fpObjSet('open', false))
                        }}>&lt;
                        </button>
                    </div>
                    <div>
                        <IconButton onClick={() => {
                            ChatState.setState(fpObjSet('responses', new Map))
                        }} icon={<NewChatIcon />}>New Chat</IconButton>
                    </div>

                </div>

                {/*<button>Settings</button>*/}
            </div>

            <Accordion>
                <Drawer title="Model" drawerId="model">
                    <div>
                        <RadioMenu className={css.radioMenu}
                            options={modelCategoryOptions}
                            value={state.modelCategory}
                            onChange={ev => ModelState.setState(fpObjSet('modelCategory', ev.value))} />
                    </div>

                    {modelOptions ? <label>
                        <Select options={modelOptions} value={state.model} onChange={modelChange} />
                    </label> : null}
                    {state.model ? <ModelInfoTable model={state.model} /> : null}

                </Drawer>

                <Drawer title="Usage" drawerId="usage">
                    <ShowUsage />
                </Drawer>

                <Drawer title="Assistants" drawerId="assistants">
                    <AssistantList />
                    <div className={css.helpLinks}>
                        <ExternalLink href="https://platform.openai.com/assistants/api-keys">Create</ExternalLink>
                        {' | '}
                        <ActionLink onClick={() => {
                            ModelState.setState(fpObjSet('assistantId',''))
                        }}>Clear</ActionLink>
                    </div>
                </Drawer>

                <Drawer title="API Keys" drawerId="api-keys">
                    <div>
                        <label className={css.labelWithInput}>
                            <span>Open AI</span>
                            <TextInput value={state.apiKey} onChange={keyChange} className={css.apiKeyInput} />
                        </label>
                        <div className={css.helpLinks}>
                            <ExternalLink href="https://platform.openai.com/api-keys">Get Key</ExternalLink>
                            {' | '}
                            <ExternalLink href="https://platform.openai.com/usage">Usage</ExternalLink>
                        </div>
                    </div>

                    <div>
                        <label className={css.labelWithInput}>
                            <span>Vertex AI</span>
                            <TextInput value={state.vertexAiKey}
                                onChange={ev => ModelState.setState(fpObjSet('vertexAiKey', ev.value))}
                                className={css.apiKeyInput} />
                        </label>
                        <div className={css.helpLinks}>
                            <ExternalLink href="https://makersuite.google.com/app/apikey">Get
                                Key</ExternalLink> | <ExternalLink href="https://cloud.google.com/vertex-ai/pricing">Pricing</ExternalLink> | <ExternalLink
                            href="https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/cost">Usage</ExternalLink>
                        </div>
                    </div>

                    <div>
                        <label className={css.labelWithInput}>
                            <span>Google Maps</span>
                            <TextInput value={state.googleMapsKey}
                                onChange={ev => ModelState.setState(fpObjSet('googleMapsKey', ev.value))}
                                className={css.apiKeyInput} />
                        </label>
                        <div className={css.helpLinks}>
                            <ExternalLink href="https://console.cloud.google.com/google/maps-apis/credentials">Get
                                Key</ExternalLink>
                        </div>
                    </div>
                </Drawer>
            </Accordion>
        </div>
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
                <b>Total Cost:</b> <Price value={state.cost} />
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
                    <td><Price value={info.input} /> / 1k tokens</td>
                </tr>
                <tr>
                    <th>Output</th>
                    <td><Price value={info.output} /> / 1k tokens</td>
                </tr>
                {info.contextWindow ? <tr>
                    <th>Context</th>
                    <td>{formatNumber(info.contextWindow)}</td>
                </tr> : null}

            </tbody>
        </table>
    )
}

function Floater() {
    return (
        <div className={css.floater}>
            <button onClick={() => {
                SidebarState.setState(fpObjSet('open', true))
            }}>=
            </button>
        </div>
    )
}

export default function App() {


    return (
        <QueryClientProvider client={queryClient}>
            <Page>
                <ChatContents />
                <SideBarContents />
            </Page>
        </QueryClientProvider>
    )
}

