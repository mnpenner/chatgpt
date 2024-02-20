import {createQuery} from '../lib/query-wrap.ts'
import {getOpenAi} from '../lib/openai.ts'


export const useListAssistants = createQuery({
    queryFn: async () => {
        const openai = await getOpenAi()
        const result = await openai.beta.assistants.list({

        });
        // console.log('ass',result)
        return result.data
    },
    staleTime: 30_000,
})
