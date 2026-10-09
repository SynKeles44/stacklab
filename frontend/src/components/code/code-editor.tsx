import { javascript } from '@codemirror/lang-javascript'
import { php } from '@codemirror/lang-php'
import { EditorView } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

type Props = { value: string; onChange: (value: string) => void; language: 'js' | 'ts' | 'jsx' | 'tsx' | 'php'; className?: string; minHeight?: string; readOnly?: boolean }

export function CodeEditor({ value, onChange, language, className, minHeight = '180px', readOnly = false }: Props) {
  const { resolvedTheme } = useTheme()
  const extensions = useMemo(() => {
    const lang =
      language === 'php'
        ? php({ plain: false })
        : javascript({ jsx: language === 'jsx' || language === 'tsx', typescript: language === 'ts' || language === 'tsx' })
    return [lang, EditorView.lineWrapping]
  }, [language])

  return (
    <div className={cn('overflow-hidden rounded-xl border text-[0.85rem]', className)}>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        minHeight={minHeight}
        readOnly={readOnly}
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true, autocompletion: true, tabSize: 2 }}
        aria-label="Code-Editor"
      />
    </div>
  )
}
