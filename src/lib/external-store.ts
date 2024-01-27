import {Resolvable, Next, resolveValue} from './resolvable'

export type StoreListener<T> = (value: T) => void

export class ExternalStore<T> {
    #value: T
    readonly #listeners: Set<StoreListener<T>>

    constructor(value: T) {
        this.#value = value
        this.#listeners = new Set
    }

    getSnapshot = () => this.#value

    subscribe = (listener: StoreListener<T>) => {
        this.#listeners.add(listener)
        return () => {
            this.#listeners.delete(listener)
        }
    }

    setState = (state: Next<T>) => {
        const newState = resolveValue(state, this.#value)
        if(!Object.is(this.#value, newState)) {
            this.#value = newState
            for(const listener of this.#listeners) {
                listener(newState)
            }
        }
    }
}
