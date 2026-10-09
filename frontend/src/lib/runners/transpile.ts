import { transform } from 'sucrase'

export type CodeLanguage = 'js' | 'ts' | 'jsx' | 'tsx'

export function transpile(code: string, language: CodeLanguage): string {
  const transforms: ('typescript' | 'jsx')[] = []
  if (language === 'ts' || language === 'tsx') transforms.push('typescript')
  if (language === 'jsx' || language === 'tsx') transforms.push('jsx')
  if (transforms.length === 0) return code
  return transform(code, { transforms, jsxPragma: 'React.createElement', jsxFragmentPragma: 'React.Fragment', production: true }).code
}
