import React, {createContext, useContext, useId, useState} from 'react'
import {AccordionState} from './state/accordion-state.ts'
import {useEvent} from './hooks/useEvent.ts'
import {fpMapSet,fpMapDelete} from '@mpen/imut-utils'
import css from './chat.module.css'
import cc from 'classcat'
import {useStableId} from './hooks/useStableId.ts'
import {useUnmount} from 'react-use'
import ChevronSvg from './assets/chevron-right.svg?react'
import {onRef} from './lib/react.ts'

export type DrawerProps = {
    children: React.ReactNode
    title: string
}

type TAccordionContext = string

const AccordionContext = createContext<TAccordionContext>('');


function setScrollHeight(el: HTMLDivElement|null) {
    if(!el) return
    el.style.height = '0'
    el.addEventListener('transitionend', () => {
        el.style.removeProperty('height')
    }, {once: true});
    el.style.height = `${el.scrollHeight}px`
}

function ScrollHeightDiv({isOpen, children}: {isOpen: boolean, children: React.ReactNode}) {
    // const [height,setHeight] = useState('')
    const setRef = onRef(el => {
        if(isOpen) {
            Object.assign(el.style, {
                transitionTimingFunction: 'ease-out',
                height: `${el.scrollHeight}px`,
            })
        } else {
            // el.style.height = `${el.scrollHeight}px`
            Object.assign(el.style, {
                transitionTimingFunction: 'ease-in',
                height: '0',
            })
        }
    })
    return <div className={css.drawerWrap} ref={setRef}>{children}</div>
}

export function Drawer({children,title}: DrawerProps) {
    const drawerId = useId()
    const accordionId = useContext(AccordionContext) ?? ''
    const isOpen = AccordionState.useState(m => m.get(accordionId)) === drawerId
    const click = useEvent(() => {
        AccordionState.setState(fpMapSet(accordionId,id => id === drawerId ? '' : drawerId))
    })
    return (
        <div>
            <div onClick={click} className={cc([css.drawerTitle,isOpen && css.drawerOpen])}>
                <span>{title}</span>
                <span className={css.chevron}><ChevronSvg/></span>
            </div>
            <ScrollHeightDiv isOpen={isOpen}><div className={css.drawerContents}>{children}</div></ScrollHeightDiv>
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
