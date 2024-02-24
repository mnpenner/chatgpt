import {OverrideProps} from './types/util-types.ts'
import {FC, ReactNode} from 'react'
import cc from 'classcat'
import css from './chat.module.css'

export type IconButtonProps = OverrideProps<'button', {
    icon: ReactNode
}>
export const IconButton: FC<IconButtonProps> = ({icon,className,children,...props}) => (
    <button {...props} className={cc([css.iconButton,className])}>
        {icon}
        {children ? <span>{children}</span> : null}
    </button>
)
