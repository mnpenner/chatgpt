import React, {createContext, useContext, useId} from 'react'
import {AccordionState} from './state/accordion-state.ts'
import {useEvent} from './hooks/useEvent.ts'
import {fpMapSet,fpMapDelete} from '@mpen/imut-utils'
import css from './chat.module.css'
import cc from 'classcat'
import {useStableId} from './hooks/useStableId.ts'
import {useUnmount} from 'react-use'

export type DrawerProps = {
    children: React.ReactNode
    title: string
}

type TAccordionContext = string

const AccordionContext = createContext<TAccordionContext>('');


export function Drawer({children,title}: DrawerProps) {
    const drawerId = useId()
    const accordionId = useContext(AccordionContext) ?? ''
    const isOpen = AccordionState.useState(m => m.get(accordionId)) === drawerId
    const click = useEvent(() => {
        AccordionState.setState(fpMapSet(accordionId,drawerId))
    })
    return (
        <div>
            <div onClick={click} className={cc([css.drawerTitle,isOpen && css.drawerOpen])}>
                {title}
            </div>
            {isOpen ? <div className={css.drawerContents}>{children}</div> : null}
        </div>
    )
}

type AccordionProps = {
    children: React.ReactNode
}

export function Accordion({children}:AccordionProps) {
    const accordionId = useId()
    useUnmount(() => {
        AccordionState.setState(fpMapDelete(accordionId))
    })
    return (
        <AccordionContext.Provider value={accordionId}>
            {children}
        </AccordionContext.Provider>
    )
}
