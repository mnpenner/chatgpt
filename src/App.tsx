import {withClass} from './with-class.tsx'
import css from './chat.module.css'
import sendButton from './assets/send.svg'

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
                            <button className={css.imageButton} style={{backgroundImage:`url(${sendButton})`}}/>
                        </ChatBar>
                    </Indent>
                </BottomBar>
            </ChatStack>
        </Page>
    )
}

export default App
