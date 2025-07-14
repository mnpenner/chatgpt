import {defineZodTool} from '../define-tool.ts'
import {z} from 'zod'

export default defineZodTool({
    desc: "Evaluates JavaScript code represented as a string and returns its completion value.",
    params: z.object({
        script: z.string().describe("A string representing a JavaScript expression, statement, or sequence of statements."),
    }),
    exec: ({ script }) => new Promise((resolve, reject) => {
        const workerScript = URL.createObjectURL(new Blob([`onmessage = ev => postMessage(eval(ev.data));`], { type: 'application/javascript' }));
        const worker = new Worker(workerScript);
        URL.revokeObjectURL(workerScript);
        worker.onmessage = ev => { resolve(ev.data); worker.terminate(); };
        worker.onerror = error => { reject(error); worker.terminate(); };
        worker.postMessage(script);
    }),
})
