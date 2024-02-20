import {nil, OverrideProps, RequiredKeys} from './types/util-types.ts'
import React, {ComponentPropsWithoutRef} from 'react'
import {cast} from './types/assert.ts'

export type LinkRelation = string | string[] | nil

export type ExternalLinkProps = OverrideProps<'a', {
    rel?: LinkRelation
}>

export function ExternalLink(props: ExternalLinkProps) {
    return <a target="_blank" {...props} rel={mergeLinkRelations(['noreferrer', props.rel])} />
}

function unique<T>(values?: readonly T[] | nil): T[] {
    return Array.from(new Set(values))
}

function mergeLinkRelations(rel: LinkRelation[]): string {
    return unique(
        rel
            .flat()
            .filter(Boolean)
            .map(rel => String(rel).trim().toLowerCase())
            .filter(rel => rel.length > 0)
    ).join(' ')
}


export type ActionLinkProps = RequiredKeys<Omit<ComponentPropsWithoutRef<'a'>, 'href'>, 'onClick'>

export function ActionLink({onClick, ...props}: ActionLinkProps) {
    cast<ComponentPropsWithoutRef<'a'>>(props)
    props.onClick = ev => {
        ev.preventDefault()
        onClick(ev)
    }
    return <a {...props} />
}
