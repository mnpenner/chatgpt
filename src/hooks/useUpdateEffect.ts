import { useEffect, useRef, EffectCallback, DependencyList } from 'react';

export function useUpdateEffect(effect: EffectCallback, dependencies?: DependencyList): void {
    const isInitialMount = useRef<boolean>(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            return effect();
        }
        // This is to suppress the ESLint warning about missing dependencies.
        // It's safe to ignore it in this case because we're manually handling the dependencies through the `dependencies` argument.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
}

