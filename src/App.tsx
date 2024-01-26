import {withClass} from './with-class.tsx'
import css from './chat.module.css'

const Page = withClass('div', css.page)
const Indent = withClass('div', css.indent)
const TopBar = withClass('div', css.topBar)
const BottomBar = withClass('div', css.bottomBar)
const ChatStack = withClass('div', css.chatStack)
const ChatBar = withClass('div', css.chatBar)

function App() {
    return (
        <Page>
            <ChatStack>
                <TopBar>
                    <Indent>
                        yoyoyo
                    </Indent>
                </TopBar>
                <BottomBar>
                    <Indent>
                        <ChatBar>
                            <div className={css.flex1}>
                                <input className={css.input}/>
                            </div>
                            <button className={css.imageButton}>Send</button>
                        </ChatBar>
                    </Indent>
                </BottomBar>
            </ChatStack>
        </Page>
    )
}

export default App
