import { z } from 'zod'

const md = z.string()

export const questionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('single'), question: md, options: z.array(z.string()), answer: z.number().int(), explanation: md, module: z.string().optional() }),
  z.object({ type: z.literal('multiple'), question: md, options: z.array(z.string()), answers: z.array(z.number().int()), explanation: md, module: z.string().optional() }),
  z.object({ type: z.literal('cloze'), question: md.optional(), text: md, blanks: z.array(z.array(z.coerce.string())), explanation: md, module: z.string().optional() }),
  z.object({ type: z.literal('match'), question: md, pairs: z.array(z.object({ left: z.coerce.string(), right: z.coerce.string() })), explanation: md, module: z.string().optional() }),
  z.object({ type: z.literal('find-bug'), question: md, language: z.string().optional(), code: z.string(), bug_line: z.number().int(), explanation: md, module: z.string().optional() }),
])
export type Question = z.infer<typeof questionSchema>

/** Exam questions arrive without solutions. */
export const publicQuestionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('single'), question: md, options: z.array(z.string()), module: z.string().optional() }),
  z.object({ type: z.literal('multiple'), question: md, options: z.array(z.string()), module: z.string().optional() }),
  z.object({ type: z.literal('cloze'), question: md.optional(), text: md, blank_count: z.number().int(), module: z.string().optional() }),
  z.object({ type: z.literal('match'), question: md, lefts: z.array(z.string()), rights: z.array(z.string()), module: z.string().optional() }),
  z.object({ type: z.literal('find-bug'), question: md, language: z.string().optional(), code: z.string(), module: z.string().optional() }),
])
export type PublicQuestion = z.infer<typeof publicQuestionSchema>

export const checkSchema = z.object({
  type: z.enum(['file_exists', 'dir_exists', 'file_absent', 'file_contains', 'command']),
  path: z.string().optional(),
  pattern: z.string().optional(),
  run: z.string().optional(),
  message: z.string().optional(),
})

const taskBase = {
  id: z.string(),
  title: z.string(),
  description: md,
  hints: z.array(md).optional(),
  solution: md.optional(),
  module: z.string().optional(),
}

export const taskSchema = z.discriminatedUnion('type', [
  z.object({ ...taskBase, type: z.literal('terminal'), workdir: z.string(), setup: z.string().optional(), checks: z.array(checkSchema) }),
  z.object({
    ...taskBase,
    type: z.literal('simulated'),
    prompt: z.string().optional(),
    steps: z.array(z.object({ expect: z.string(), output: z.string().optional(), prompt: z.string().optional(), hint: z.string().optional() })),
    responses: z.array(z.object({ match: z.string(), output: z.string() })).optional(),
  }),
  z.object({
    ...taskBase,
    type: z.literal('code'),
    language: z.enum(['js', 'ts', 'jsx', 'tsx', 'php']),
    starter: z.string().optional(),
    tests: z.array(z.object({ name: z.string(), code: z.string() })),
  }),
  z.object({
    ...taskBase,
    type: z.literal('dragdrop'),
    targets: z.array(z.object({ id: z.string(), label: z.string() })),
    items: z.array(z.object({ label: z.coerce.string(), target: z.string() })),
  }),
  z.object({ ...taskBase, type: z.literal('order'), items: z.array(z.coerce.string()) }),
  z.object({
    ...taskBase,
    type: z.literal('diagram'),
    image: z.string(),
    slots: z.array(z.object({ x: z.number(), y: z.number(), answer: z.coerce.string() })),
    distractors: z.array(z.coerce.string()).optional(),
  }),
  z.object({
    ...taskBase,
    type: z.literal('request'),
    base_url: z.string().optional(),
    expected: z.object({
      method: z.string(),
      path: z.string(),
      headers: z.record(z.string(), z.string()).optional(),
      body_contains: z.array(z.string()).optional(),
    }),
    response: z.object({ status: z.number(), body: z.string().optional(), headers: z.record(z.string(), z.string()).optional() }).optional(),
  }),
  z.object({
    ...taskBase,
    type: z.literal('steps'),
    steps: z.array(z.object({ situation: md, question: md, options: z.array(z.string()), answer: z.number().int(), explanation: md.optional() })),
  }),
])
export type Task = z.infer<typeof taskSchema>
export type TaskOf<T extends Task['type']> = Extract<Task, { type: T }>
