import {createQuery} from '../lib/query-wrap.ts'
import {getOpenAi} from '../lib/openai.ts'
import {ModelState} from '../state/model-state.ts'
import {getJson} from '../lib/ajax.ts'
import {appendQueryParams} from '../lib/url-params.ts'


export const useListAssistants = createQuery({
    queryFn: async () => {
        const openai = await getOpenAi()
        const result = await openai.beta.assistants.list({
            limit: 100
        });
        // console.log('ass',result)
        return result.data
    },
    staleTime: 30_000,
})

export const useListThreads = createQuery({
    retry: false,
    queryFn: async () => {
        // https://community.openai.com/t/list-and-delete-all-threads/505823/4
        const res = await getJson({
            url: appendQueryParams("https://api.openai.com/v1/threads",{limit:100}),
            bearerToken: ModelState.getSnapshot().apiKey,
            headers: {
                "OpenAI-Beta": "assistants=v1",
            }
        })

        console.log(res)

        return []
    },
    staleTime: 30_000,
})
