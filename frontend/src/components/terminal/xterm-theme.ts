import type { ITheme } from '@xterm/xterm'

export const XTERM_THEME: ITheme = {
  background: '#15132a',
  foreground: '#e8e6f5',
  cursor: '#a78bfa',
  cursorAccent: '#15132a',
  selectionBackground: '#7c3aed66',
  black: '#1f1d36',
  red: '#f87171',
  green: '#4ade80',
  yellow: '#fbbf24',
  blue: '#60a5fa',
  magenta: '#c084fc',
  cyan: '#22d3ee',
  white: '#e8e6f5',
  brightBlack: '#6b6890',
  brightRed: '#fca5a5',
  brightGreen: '#86efac',
  brightYellow: '#fde68a',
  brightBlue: '#93c5fd',
  brightMagenta: '#d8b4fe',
  brightCyan: '#67e8f9',
  brightWhite: '#ffffff',
}

export const XTERM_OPTIONS = {
  theme: XTERM_THEME,
  fontFamily: "ui-monospace, 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace",
  fontSize: 14,
  lineHeight: 1.25,
  cursorBlink: true,
  scrollback: 3000,
  allowProposedApi: false,
}
