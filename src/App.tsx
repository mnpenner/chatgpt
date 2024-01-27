import {withClass} from './with-class.tsx'
import css from './chat.module.css'
import {useForm} from "react-hook-form"
import {ChatState} from './state/chat-state.ts'
import {fpMapSet} from '@mpen/imut-utils'
import {uniqId} from './lib/misc.ts'
import {mapMap} from './lib/collection.ts'
import useEvent from './hooks/useEvent.ts'
import SendIcon from './assets/send.svg?react'


const Page = withClass('div', css.page)
const Indent = withClass('div', css.indent)
const TopBar = withClass('div', css.topBar)
const BottomBar = withClass('div', css.bottomBar)
const ChatStack = withClass('div', css.chatStack)
const ChatBar = withClass('div', css.chatBar)
const ChatBubble = withClass('li', css.chatBubble)

type FormData = {
    message: string
}

function MessageList() {
    const messages = ChatState.useState(s => s.responses)

    return (
        <ol className={css.chatList}>
            {mapMap(messages, (res, key) => <ChatBubble className={res.role === 'user' ? css.user : css.assistant}
                key={key}>{res.role}: {res.content}</ChatBubble>)}
        </ol>
    )
}

function BottomForm() {
    const {register, handleSubmit,  reset} = useForm<FormData>({
        defaultValues: {
            message: '',
        }
    })

    const onSubmit = useEvent((data: FormData) => {
        reset()

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
                <SendIcon/>
            </button>
        </form>
    )
}

export default function App() {


    return (
        <Page>
            <ChatStack>
                <TopBar>
                    <Indent>
                        <MessageList />
                    </Indent>
                </TopBar>
                <BottomBar>
                    <Indent>
                       <BottomForm/>
                    </Indent>
                </BottomBar>
            </ChatStack>
        </Page>
    )
}

