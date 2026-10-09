import {
  Activity, ArrowLeftRight, Atom, Award, Binary, Blocks, BookA, BookOpen, BookOpenText, Bot, Boxes, Braces, Bug, CalendarCheck,
  Cloud, Code, Component, Container, Cpu, Database, FileCode, FileText, FileType, Flame, FlameKindling, FolderTree, Footprints,
  Gauge, GitBranch, GitFork, GitPullRequest, Globe, GraduationCap, Hammer, KeyRound, Languages, Layers, Library, Lock, type LucideIcon, Network,
  Package, Palette, Plug, Puzzle, Regex, RefreshCw, Rocket, Search, Server, Settings, Shield, ShieldCheck, Sparkles, Terminal,
  TestTube, Trophy, Users, Workflow, Wrench, Zap,
} from 'lucide-react'

/** Icons usable by content (course.yaml `icon`) and badges. Add new ones here. */
export const ICONS: Record<string, LucideIcon> = {
  activity: Activity, 'arrow-left-right': ArrowLeftRight, atom: Atom, award: Award, binary: Binary, blocks: Blocks,
  'book-a': BookA, 'book-open': BookOpen, 'book-open-text': BookOpenText, bot: Bot, boxes: Boxes, braces: Braces, bug: Bug,
  'calendar-check': CalendarCheck, cloud: Cloud, code: Code, component: Component, container: Container, cpu: Cpu,
  database: Database, 'file-code': FileCode, 'file-text': FileText, 'file-type': FileType, flame: Flame,
  'flame-kindling': FlameKindling, 'folder-tree': FolderTree, footprints: Footprints, gauge: Gauge, 'git-branch': GitBranch,
  'git-fork': GitFork, 'git-pull-request': GitPullRequest, globe: Globe, 'graduation-cap': GraduationCap, hammer: Hammer, 'key-round': KeyRound, languages: Languages,
  layers: Layers, library: Library, lock: Lock, network: Network, package: Package, palette: Palette, plug: Plug,
  puzzle: Puzzle, regex: Regex, 'refresh-cw': RefreshCw, rocket: Rocket, search: Search, server: Server, settings: Settings,
  shield: Shield, 'shield-check': ShieldCheck, sparkles: Sparkles, terminal: Terminal, 'test-tube': TestTube, trophy: Trophy,
  users: Users, workflow: Workflow, wrench: Wrench, zap: Zap,
}

export function iconFor(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name]) || BookOpen
}
