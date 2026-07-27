import { useMemo } from 'react'
import katex from 'katex'
import { splitRich } from '../lib/rich'

export function Tex({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: block, throwOnError: false, strict: false }),
    [tex, block],
  )
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

/** Prose with `$math$` and `` `code` `` spans; see `lib/rich`. */
export function Rich({ text }: { text: string }) {
  const parts = useMemo(() => splitRich(text), [text])
  return (
    <>
      {parts.map((p, i) =>
        p.kind === 'math' ? (
          <Tex key={i} tex={p.text} />
        ) : p.kind === 'code' ? (
          <code key={i}>{p.text}</code>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  )
}
