import type { Blockquote, Paragraph, Root } from 'mdast'
import { visit } from 'unist-util-visit'

export const CALLOUT_TYPES = ['MERKSATZ', 'FEHLER', 'PRAXIS', 'TIPP', 'HINWEIS', 'ACHTUNG'] as const
export type CalloutType = (typeof CALLOUT_TYPES)[number]

const MARKER = /^\[!([A-Z]+)\]\s*/

/** remark plugin: `> [!MERKSATZ]` blockquotes become <aside data-callout="merksatz">. */
export function remarkCallouts() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote) => {
      const first = node.children[0] as Paragraph | undefined
      const text = first?.type === 'paragraph' && first.children[0]?.type === 'text' ? first.children[0] : null
      const match = text ? MARKER.exec(text.value) : null
      if (!first || !text || !match || !CALLOUT_TYPES.includes(match[1] as CalloutType)) return

      text.value = text.value.slice(match[0].length)
      if (text.value === '' ) {
        first.children.shift()
        if (first.children[0]?.type === 'break') first.children.shift()
        if (first.children.length === 0) node.children.shift()
      }
      node.data = { ...node.data, hName: 'aside', hProperties: { 'data-callout': match[1]!.toLowerCase() } }
    })
  }
}
