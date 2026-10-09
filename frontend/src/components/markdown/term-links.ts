import type { Root, Text, PhrasingContent } from 'mdast'
import { visit, SKIP } from 'unist-util-visit'

const PATTERN = /\[\[([a-z0-9]+(?:-[a-z0-9]+)*)(?:\|([^\]]+))?\]\]/g

/** remark plugin: turns [[slug]] / [[slug|Text]] into links with the `term:` protocol. */
export function remarkTermLinks() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || !node.value.includes('[[')) return
      const children: PhrasingContent[] = []
      let last = 0
      for (const match of node.value.matchAll(PATTERN)) {
        const start = match.index
        if (start > last) children.push({ type: 'text', value: node.value.slice(last, start) })
        children.push({ type: 'link', url: `term:${match[1]}`, children: [{ type: 'text', value: match[2] ?? match[1]! }] })
        last = start + match[0].length
      }
      if (children.length === 0) return
      if (last < node.value.length) children.push({ type: 'text', value: node.value.slice(last) })
      parent.children.splice(index, 1, ...children)
      return [SKIP, index + children.length]
    })
  }
}
