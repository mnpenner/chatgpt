import {createGlobalState} from '../lib/global-state.ts'


// Map of accordion id -> drawer id
export const AccordionState = createGlobalState<Map<string,string>>(new Map)
