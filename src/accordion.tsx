import React, {createContext, useContext, useEffect, useId, useState} from 'react'
import {AccordionState} from './state/accordion-state.ts'
import {useEvent} from './hooks/useEvent.ts'
import {fpMapSet,fpMapDelete} from '@mpen/imut-utils'
import css from './chat.module.css'
import cc from 'classcat'
import {useStableId} from './hooks/useStableId.ts'
import {useUnmount} from 'react-use'
import ChevronSvg from './assets/chevron-right.svg?react'
import {onRef} from './lib/react.ts'
import {useNullRef} from './hooks/useNullRef.ts'
import {useUpdateEffect} from './hooks/useUpdateEffect.ts'
import {addEventListener, addOnceListener} from './hooks/useEventListener.ts'

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

const OPEN_SPEED = 2000  // px per sec

function ScrollHeightDiv_({isOpen, children}: {isOpen: boolean, children: React.ReactNode}) {
    // const [height,setHeight] = useState('')
    const setRef = onRef(el => {
        console.log(el,isOpen)
        if(isOpen) {
            Object.assign(el.style, {
                transitionTimingFunction: 'ease-out',
                height: `${el.scrollHeight}px`,
                transitionDuration: `${el.scrollHeight/OPEN_SPEED}s`,
            })
        } else {
            // el.style.height = `${el.scrollHeight}px`
            Object.assign(el.style, {
                transitionTimingFunction: 'ease-in',
                height: '0',
                transitionDuration: `${el.scrollHeight/OPEN_SPEED}s`,
            })
        }
    })
    return <div className={css.drawerWrap} ref={setRef}>{children}</div>
}

enum OpenState {
    Transitioning,
    Open,
    Closed,
}

function ScrollHeightDiv({isOpen, children}: {isOpen: boolean, children: React.ReactNode}) {
    // const [open,setOpen] = useState(isOpen)
    const div = useNullRef<HTMLDivElement>()
    const [state,setState] = useState<OpenState>(isOpen ? OpenState.Open : OpenState.Closed)

    useUpdateEffect(() => {
        const el = div.current
        if(el == null) return
        // console.log(el,isOpen)
        // console.log(el.offsetHeight,el.clientHeight,el.scrollHeight)
        setState(OpenState.Transitioning)
        if(isOpen) {
            if(el.hidden) {
                el.style.height = '0'
                el.hidden = false
            }
            // console.log(`${(el.scrollHeight-el.clientHeight)/OPEN_SPEED}s`)
            Object.assign(el.style, {
                transitionTimingFunction: 'ease-out',
                height: `${el.scrollHeight}px`,
                transitionDuration: `${(el.scrollHeight-el.clientHeight)/OPEN_SPEED}s`,
            })
            return addOnceListener(el, 'transitionend', () => {
                setState(OpenState.Open)
                el.removeAttribute('style')
            })
        } else {
            // console.log(`${el.clientHeight/OPEN_SPEED}s`)
            el.style.height = `${el.clientHeight}px`
            Object.assign(el.style, {
                transitionTimingFunction: 'ease-in',
                height: '0',
                transitionDuration: `${el.clientHeight/OPEN_SPEED}s`,
            })
            return addOnceListener(el, 'transitionend', () => {
                el.hidden = true
                setState(OpenState.Closed)
                el.removeAttribute('style')
            })
        }
    }, [isOpen])

    return <div className={css.drawerWrap} ref={div} hidden={state === OpenState.Closed}>{children}</div>
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
