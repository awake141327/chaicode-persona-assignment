import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

// Renders an assistant reply as markdown: fenced code blocks, inline code,
// lists, links, bold, etc. Styled to sit inside the glass chat bubble.
// react-markdown does not render raw HTML by default, so this is XSS-safe.
const components = {
  // react-markdown v9+ removed the `inline` prop, so detect a block by its
  // language class or a multi-line body; everything else is inline code.
  code({ className, children, ...props }) {
    const lang = /language-(\w+)/.exec(className || '')?.[1]
    const isBlock = Boolean(lang) || String(children).includes('\n')

    if (!isBlock) {
      return (
        <code
          className="rounded bg-black/8 px-1.5 py-0.5 font-mono text-[13px] dark:bg-white/15"
          {...props}
        >
          {children}
        </code>
      )
    }

    return (
      <div className="my-2 overflow-hidden rounded-xl border border-black/10 bg-slate-900 dark:border-white/10">
        {lang && (
          <div className="border-b border-white/10 px-3 py-1 font-mono text-[11px] tracking-wide text-slate-400 uppercase">
            {lang}
          </div>
        )}
        <pre className="overflow-x-auto p-3 text-[13px] leading-relaxed">
          <code className="font-mono text-slate-100" {...props}>
            {children}
          </code>
        </pre>
      </div>
    )
  },
  // Our code block renders its own container, so unwrap the default <pre>
  // to avoid a nested <pre><pre>.
  pre({ children }) {
    return <>{children}</>
  },
  a({ children, ...props }) {
    return (
      <a
        className="font-medium text-accent underline underline-offset-2"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </a>
    )
  },
  ul({ children, ...props }) {
    return (
      <ul className="my-1.5 list-disc space-y-0.5 pl-5" {...props}>
        {children}
      </ul>
    )
  },
  ol({ children, ...props }) {
    return (
      <ol className="my-1.5 list-decimal space-y-0.5 pl-5" {...props}>
        {children}
      </ol>
    )
  },
  p({ children, ...props }) {
    return (
      <p className="my-1.5 first:mt-0 last:mb-0" {...props}>
        {children}
      </p>
    )
  },
  h1: ({ children }) => <p className="my-1.5 text-base font-bold">{children}</p>,
  h2: ({ children }) => <p className="my-1.5 text-base font-bold">{children}</p>,
  h3: ({ children }) => <p className="my-1.5 font-bold">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-1.5 border-l-2 border-accent/50 pl-3 text-slate-600 italic dark:text-slate-400">
      {children}
    </blockquote>
  ),
}

function MarkdownMessage({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
}

export default MarkdownMessage
