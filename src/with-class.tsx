import React from 'react'
import cc, {type Class} from "classcat"


// Define the type for the withClass function
type WithClassProps = {
    className?: string;
    [key: string]: any; // for additional props
};

// The withClass function
export function withClass<P extends WithClassProps>(
    Component: React.ElementType<P>,
    className: Class
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<HTMLElement>> {
    // Return a new component with forwardRef
    return React.forwardRef<HTMLElement, P>((props, ref) => {
        // Render the component with combined className, other props, and ref
        // Using type assertion here to tell TypeScript that Component is a valid JSX element
        const JSXComponent = Component as React.ElementType

        return <JSXComponent {...props} className={cc([className, props.className])} ref={ref} />
    })
}
