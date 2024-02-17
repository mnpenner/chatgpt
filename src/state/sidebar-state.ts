import {createGlobalState} from '../lib/global-state.ts'


export const SidebarState = createGlobalState<{open:boolean}>({open: window.innerWidth >= 800})
