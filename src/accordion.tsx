import React, {createContext, useContext, useEffect, useId, useState} from 'react'
import {AccordionState} from './state/accordion-state.ts'
import {useEvent} from './hooks/useEvent.ts'
import {fpMapSet,fpMapDelete,fpMapUpdate} from '@mpen/imut-utils'
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
    drawerId?: string
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

const OPEN_SPEED = 1500  // px per sec

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

function ScrollHeightDiv({isOpen, children}: {isOpen: boolean, children: React.ReactNode}) {
    // const [open,setOpen] = useState(isOpen)
    const div = useNullRef<HTMLDivElement>()
    const [isClosed,setIsClosed] = useState<boolean>(!isOpen)

    useUpdateEffect(() => {
        const el = div.current
        if(el == null) return
        // console.log(el,isOpen)
        // console.log(el.offsetHeight,el.clientHeight,el.scrollHeight)
        if(isOpen) {
            setIsClosed(false)
            if(el.hidden) {
                el.style.height = '0'
                el.hidden = false
            } else {
                el.style.height = `${el.clientHeight}px`
            }
            // console.log(`${(el.scrollHeight-el.clientHeight)/OPEN_SPEED}s`)
            Object.assign(el.style, {
                transitionTimingFunction: 'ease-out',
                height: `${el.scrollHeight}px`,
                transitionDuration: `${(el.scrollHeight-el.clientHeight)/OPEN_SPEED}s`,
            })
            return addOnceListener(el, 'transitionend', () => {
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
                setIsClosed(true)
                el.removeAttribute('style')
            })
        }
    }, [isOpen])

    return <div className={css.drawerWrap} ref={div} hidden={isClosed}>{children}</div>
}

export function Drawer({drawerId,children,title}: DrawerProps) {
    const fallbackId = useId()
    const finalId = drawerId ?? fallbackId
    const accordionId = useContext(AccordionContext) ?? ''
    const isOpen = AccordionState.useState(m => m.get(accordionId)) === finalId
    const click = useEvent(() => {
        AccordionState.setState(fpMapSet(accordionId,id => id === finalId ? '' : finalId))
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
