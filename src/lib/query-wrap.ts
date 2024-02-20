import {useQuery, type UseQueryOptions} from '@tanstack/react-query'
import type {DefaultError, QueryKey} from '@tanstack/query-core'
import {uniqId} from './misc.ts'


export type CreateQueryOptions<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'>

export function createQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
>(options: CreateQueryOptions<TQueryFnData, TError, TData, [string]>) {
    const queryKey = uniqId()
    return () => useQuery({
        ...options,
        queryKey: [queryKey]
    })
}
