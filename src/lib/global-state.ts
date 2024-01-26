import {Resolvable, resolveValue} from './resolvable'
import {useSyncExternalStoreWithSelector} from 'use-sync-external-store/shim/with-selector'
import {useSyncExternalStore} from 'use-sync-external-store/shim'
import {ExternalStore} from './external-store'
import {identity} from './misc'
import React, {useMemo} from 'react'
import {isPlainObject} from '@mpen/is-type'
import {AnyFn, Fn} from './util-types.ts'


interface SubscribeOptions<TState, TValue> {
    /**
     * Fire once immediately instead of waiting until first change event.
     */
    fireImmediately?: boolean
    selector?: (select: TState) => TValue
    isEqual?: (a: TValue, b: TValue) => boolean,
}

type Selector<Snapshot, Selection> = (snapshot: Snapshot) => Selection

export function createGlobalState<TState>(initialState: TState) {
    const store = new ExternalStore(initialState)

    function useState(): TState;
    function useState<TValue>(selector: Selector<TState, TValue>): TValue;
    function useState<TValue>(selector?: Selector<TState, TValue>) {
        const select = selector ?? identity as AnyFn
        // useDebugValue(store.getSnapshot(), snapshot => select(snapshot))
        return useSyncExternalStoreWithSelector<TState, TValue>(store.subscribe, store.getSnapshot, store.getSnapshot, select, Object.is)
    }

    /**
     * Subscribe to state changes. Can be used to listen for changes outside a React component.
     *
     * @param listener Function to call when the state changes.
     * @param options Additional options.
     */
    function subscribe<TValue = TState>(listener: (value: TValue) => void, options?: SubscribeOptions<TState, TValue>) {
        let lastValue = Symbol() as TValue
        const select = options?.selector ?? identity as (state: TState) => TValue
        const isEqual = options?.isEqual ?? Object.is
        if(options?.fireImmediately) {
            listener(lastValue = select(store.getSnapshot()))
        }
        return store.subscribe(state => {
            const value = select(state)
            if(!isEqual(value, lastValue)) {
                listener(lastValue = value)
            }
        })
    }

    /**
     * Subscribe to state changes. Automatically unsubscribes when the component is unmounted.
     * Prefer this or {@link useState} over {@link subscribe} when used inside of React component.
     *
     * @param listener
     */
    function useEffect(listener: (value: TState) => void) {
        // TODO: allow a selector?
        // TODO: allow additional deps? e.g. for firing an ajax event when *either* this state or some other prop
        // changes. -- although this is more of a convenience anyway, it can easily be combined with useState.
        return React.useEffect(() => store.subscribe(listener), [])
    }

    return {
        useState,
        setState: store.setState,
        subscribe,
        getSnapshot: store.getSnapshot,
        useEffect,
    }
}
