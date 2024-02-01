import {OverrideProps} from './types/util-types.ts'
import ReactMarkdown, {Components, Options} from 'react-markdown'
import css from './chat.module.css'
import ClipboardSvg from './assets/clipboard.svg?react'
import remarkGfm from 'remark-gfm'
import useEvent from './hooks/useEvent.ts'
import cc from 'classcat'
import {ExternalLink} from './links.tsx'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import dark from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus'
import {Element} from 'hast'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you

const LANG_PREFIX = 'language-'

const langMap: Record<string, string> = {
    css: css.langCss,

    ts: css.langTs,
    tsx: css.langTs,
    typescript: css.langTs,

    js: css.langJs,
    jsx: css.langJs,
    javascript: css.langJs,

    c: css.langCpp,
    h: css.langCpp,
    'c++': css.langCpp,
    cpp: css.langCpp,
    cxx: css.langCpp,
    hpp: css.langCpp,

    rs: css.langRust,
    rust: css.langRust,

    zig: css.langZig,
}

const markdownComponents: Components = {
    pre({node, children, ...props}) {
        // console.log('node',node)
        if(node?.children.length === 1) {
            const child = node.children[0] as Element
            if(child.tagName === 'code') {
                child.properties.block = true
                // console.log('node.children[0]',node.children[0])
                return <>{children}</>
            }
        }
        return <pre {...props}>{children}</pre>
    },
    // ol({node, children, ...props}) {
    //     return <ol className={css.resOl} {...props}>{children}</ol>
    // },
    a({node, children, ...props}) {
        return <ExternalLink {...props}>{children}</ExternalLink>
    },
    // p({node, children, ...props}) {
    //     return <p>{children}</p>
    // },
    code({children, className, node, ref, ...rest}) {
        // console.log(node?.properties.inline)
        // console.log('node',node,'children',children,'rest',rest)

        // console.log(node,inline,className,props)
        if(!node?.properties.block) {
            return <code className={css.inlineCode} {...rest}>{children}</code>
        }
        const lang = className?.startsWith(LANG_PREFIX) ? className.slice(LANG_PREFIX.length) : null

        const copyToClipboard = useEvent(() => {
            const text = node!.children.reduce((prev, curr) => {
                if(curr.type === 'text') {
                    return prev + curr.value
                }
                return prev
            }, '')

            navigator.clipboard?.writeText(text).catch(console.error)
        })

        return (
            <div className={css.codeBlockWrapper}>
                <div className={css.codeAboveBar}>
                    {lang ? <span className={cc([css.langName, langMap[lang.toLowerCase()]])}>{lang}</span> : null}
                    {navigator.clipboard ? <button className={css.copyLink} onClick={copyToClipboard}>
                        <ClipboardSvg /><span>Copy</span>
                    </button>  : null}
                </div>
                {lang ? <SyntaxHighlighter
                    {...rest}
                    PreTag="div"
                    children={String(children).replace(/\n$/, '')}
                    language={lang}
                    style={dark}
                    customStyle={{
                        margin: 0,
                    }}
                /> : <code className={cc([css.codeblock, lang && css.hasLang])} {...rest}>{children}</code>}
            </div>
        )
    }
}

export type MarkdownProps = OverrideProps<typeof ReactMarkdown, {}, 'components'>

export function Markdown(props: MarkdownProps) {
    return <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm,remarkMath]} rehypePlugins={[rehypeKatex]} {...props} />
}
