import type { Element, ElementContent } from 'hast'
import { Children, isValidElement, type ReactNode } from 'react'
import Markdown, { type Components } from 'react-markdown'
import { Link } from 'react-router'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { RunnableCode } from '@/components/code/runnable-code'
import { TermLink } from '@/components/glossary/term-link'
import type { TermPreview } from '@/lib/api'
import { Callout } from './callout'
import { remarkCallouts } from './callouts'
import { CodeBlock } from './code-block'
import { remarkTermLinks } from './term-links'

function textOf(node: ElementContent | Element): string {
  if (node.type === 'text') return node.value
  if ('children' in node) return node.children.map((child) => textOf(child as ElementContent)).join('')
  return ''
}

function parseMeta(meta: string | undefined): { run: boolean; title: string | null } {
  if (!meta) return { run: false, title: null }
  const title = /title="([^"]*)"/.exec(meta)?.[1] ?? null
  return { run: /(^|\s)run(\s|$)/.test(meta), title }
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function headingText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => (typeof child === 'string' ? child : isValidElement<{ children?: ReactNode }>(child) ? headingText(child.props.children) : ''))
    .join('')
}

export function LessonMarkdown({ body, terms }: { body: string; terms: TermPreview[] }) {
  const termMap = new Map(terms.map((term) => [term.slug, term]))

  const components: Components = {
    a({ href, children }) {
      if (href?.startsWith('term:')) {
        const slug = href.slice(5)
        return (
          <TermLink slug={slug} term={termMap.get(slug)}>
            {children}
          </TermLink>
        )
      }
      if (href?.startsWith('/')) return <Link to={href}>{children}</Link>
      return (
        <a href={href} target="_blank" rel="noreferrer noopener">
          {children}
        </a>
      )
    },
    aside(props) {
      const type = (props as { 'data-callout'?: string })['data-callout'] ?? 'hinweis'
      return <Callout type={type}>{props.children}</Callout>
    },
    h2({ children }) {
      return <h2 id={slugifyHeading(headingText(children))}>{children}</h2>
    },
    h3({ children }) {
      return <h3 id={slugifyHeading(headingText(children))}>{children}</h3>
    },
    pre({ node, children }) {
      const code = node?.children.find((child): child is Element => child.type === 'element' && child.tagName === 'code')
      if (!code) return <pre>{children}</pre>
      const className = (code.properties?.className as string[] | undefined) ?? []
      const language = className.find((name) => name.startsWith('language-'))?.slice(9) ?? null
      const meta = parseMeta((code.data as { meta?: string } | undefined)?.meta)
      const raw = textOf(code)
      if (meta.run && (language === 'js' || language === 'javascript' || language === 'ts' || language === 'typescript')) {
        return <RunnableCode initial={raw.replace(/\n$/, '')} language={language.startsWith('t') ? 'ts' : 'js'} />
      }
      const inner = isValidElement<{ children?: ReactNode }>(children) ? children.props.children : children
      return (
        <CodeBlock language={language} title={meta.title} raw={raw}>
          {inner}
        </CodeBlock>
      )
    },
    table({ children }) {
      return (
        <div className="not-prose overflow-x-auto rounded-xl border [&_table]:w-full [&_td]:border-b [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:border-b [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_tr:last-child_td]:border-0">
          <table className="text-sm">{children}</table>
        </div>
      )
    },
    img({ src, alt }) {
      return (
        <figure className="not-prose my-6">
          <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" className="mx-auto w-full max-w-3xl rounded-xl border bg-card p-2" />
          {alt && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{alt}</figcaption>}
        </figure>
      )
    },
  }

  return (
    <div className="lesson-prose">
      <Markdown
        remarkPlugins={[remarkGfm, remarkTermLinks, remarkCallouts]}
        rehypePlugins={[[rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={components}
        urlTransform={(url) => (url.startsWith('term:') || url.startsWith('/') || /^https?:/.test(url) || url.startsWith('#') ? url : '')}
      >
        {body}
      </Markdown>
    </div>
  )
}
