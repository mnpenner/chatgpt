import {useListAssistants, useListThreads} from './queries/assistants.ts'
import {ModelState} from './state/model-state.ts'
import {fpObjSet} from '@mpen/imut-utils'
import css from './chat.module.css'
import {OaiThreadState} from './state/oai-thread-state.ts'

export function AssistantList() {
    const query = useListAssistants()
    const assId = ModelState.useState(s => s.assistantId)
    if(!query.data) return <p>Loading...</p>
    return (
        <ol className={css.assistantList}>
            {query.data.map(ass => (
                <li key={ass.id} onClick={() => {
                    ModelState.setState(fpObjSet('assistantId',ass.id))
                }}>
                    {ass.name} &middot; {ass.model} {ass.instructions?.length ? <span title={ass.instructions}>(i)</span> : null}
                    {ass.id === assId ? ' ✅' : null}</li>
            ))}
        </ol>
    )
}

export function ThreadList() {
    // const query = useListThreads()
    // if(!query.data) return <p>Loading...</p>
    // return null
    const threads = OaiThreadState.useState()
    const currThreadId = ModelState.useState(s => s.threadId)
    if(!threads?.length) return <p>No threads.</p>
    return (
        <ol className={css.assistantList}>
            {threads.map(thread => (
                <li key={thread.id} onClick={() => {
                    ModelState.setState(fpObjSet('threadId',thread.id))
                }}>
                    {thread.id}
                    {thread.id === currThreadId ? ' ✅' : null}
                </li>
            ))}
        </ol>
    )
}
