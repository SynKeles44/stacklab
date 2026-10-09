import { z } from 'zod'
import { publicQuestionSchema, questionSchema, taskSchema } from '@/lib/content-schemas'
import { api } from './client'

export { ApiError } from './client'

const nullableString = z.string().nullable()

const userSchema = z.object({ id: z.number(), name: z.string(), email: z.string(), ui_variant: z.enum(['standard', 'apple']).optional() })
const sessionSchema = z.object({ token: z.string(), user: userSchema })

const progressSchema = z.object({ completed: z.number(), total: z.number(), percent: z.number() })

export const courseSummarySchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  subtitle: nullableString,
  description: z.string(),
  category: z.string(),
  level: z.string(),
  position: z.number(),
  icon: nullableString,
  color: nullableString,
  estimated_hours: z.number(),
  workspace_dir: nullableString,
  lessons_count: z.number(),
  modules_count: z.number(),
  progress: progressSchema.nullable().optional(),
})
export type CourseSummary = z.infer<typeof courseSummarySchema>

const lessonLinkSchema = z.object({ slug: z.string(), title: z.string() })

export const courseDetailSchema = courseSummarySchema.extend({
  learning_goals: z.array(z.string()),
  references: z.array(z.string()),
  prerequisites: z.array(z.object({ slug: z.string(), title: z.string() })),
  modules: z.array(
    z.object({
      id: z.number(),
      slug: z.string(),
      title: z.string(),
      description: nullableString,
      position: z.number(),
      exercise: taskSchema.nullable(),
      exercise_done: z.boolean(),
      lessons: z.array(
        z.object({
          id: z.number(),
          slug: z.string(),
          title: z.string(),
          summary: nullableString,
          duration_minutes: z.number(),
          task_count: z.number(),
          completed: z.boolean(),
        }),
      ),
    }),
  ),
  project: z.object({ title: z.string(), description: z.string(), step_count: z.number() }).nullable(),
  exam: z.object({ title: z.string(), question_count: z.number(), time_limit_minutes: z.number().nullable() }).nullable(),
  next_lesson: lessonLinkSchema.nullable(),
})
export type CourseDetail = z.infer<typeof courseDetailSchema>
export type CourseModule = CourseDetail['modules'][number]

const courseRefSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  color: nullableString,
  icon: nullableString,
  workspace_dir: nullableString.optional(),
})
export type CourseRef = z.infer<typeof courseRefSchema>

const termPreviewSchema = z.object({ slug: z.string(), term: z.string(), short: z.string(), example: nullableString.optional(), category: z.string().optional() })
export type TermPreview = z.infer<typeof termPreviewSchema>

export const lessonSchema = z.object({
  lesson: z.object({
    id: z.number(),
    slug: z.string(),
    title: z.string(),
    summary: nullableString,
    duration_minutes: z.number(),
    body: z.string(),
    quiz: z.array(questionSchema),
    tasks: z.array(taskSchema),
    sources: z.array(z.object({ title: z.string(), url: z.string() })),
    module: z.object({ id: z.number(), slug: z.string(), title: z.string() }),
    course: courseRefSchema,
    terms: z.array(termPreviewSchema),
    previous: lessonLinkSchema.nullable(),
    next: lessonLinkSchema.nullable(),
    position: z.number().nullable(),
    total: z.number(),
  }),
  state: z
    .object({
      completed: z.boolean(),
      completed_tasks: z.array(z.string()),
      unlocked_terms: z.array(z.string()),
      best_quiz: z.object({ score: z.number(), max_score: z.number() }).nullable(),
      note: nullableString,
    })
    .nullable(),
})
export type LessonResponse = z.infer<typeof lessonSchema>
export type Lesson = LessonResponse['lesson']

const termSchema = z.object({
  slug: z.string(),
  term: z.string(),
  short: z.string(),
  explanation: z.string(),
  example: nullableString,
  category: z.string(),
  aliases: z.array(z.string()),
  lesson: z.object({ slug: z.string(), title: z.string(), course_slug: nullableString }).nullable(),
  unlocked_at: nullableString,
})
export type Term = z.infer<typeof termSchema>

const projectSchema = z.object({
  project: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    goal: nullableString,
    workdir: z.string().optional(),
    has_setup: z.boolean().optional(),
    steps: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        checklist: z.array(z.string()).optional(),
        hints: z.array(z.string()).optional(),
        checks: z.array(z.unknown()).optional(),
        solution: z.string().optional(),
        workdir: z.string().optional(),
        can_solve: z.boolean().optional(),
      }),
    ),
    course: courseRefSchema,
  }),
  completed_steps: z.array(z.string()),
})
export type Project = z.infer<typeof projectSchema>['project']

const examInfoSchema = z.object({
  exam: z.object({
    id: z.number(),
    title: z.string(),
    description: nullableString,
    time_limit_minutes: z.number().nullable(),
    pass_percent: z.number(),
    question_count: z.number(),
    task_count: z.number(),
    course: courseRefSchema,
  }),
  attempts: z.array(z.object({ id: z.number(), score: z.number(), max_score: z.number(), passed: z.boolean(), finished_at: nullableString })),
})
export type ExamInfo = z.infer<typeof examInfoSchema>

const examStartSchema = z.object({
  attempt_id: z.number(),
  started_at: z.string(),
  deadline: nullableString,
  questions: z.array(publicQuestionSchema),
  tasks: z.array(taskSchema),
})
export type ExamStart = z.infer<typeof examStartSchema>

const examResultSchema = z.object({
  attempt: z.object({
    id: z.number(),
    score: z.number(),
    max_score: z.number(),
    passed: z.boolean(),
    started_at: z.string(),
    finished_at: nullableString,
    user_name: nullableString.optional(),
    result: z
      .object({
        percent: z.number(),
        modules: z.array(z.object({ module: z.string(), title: z.string(), score: z.number(), max: z.number(), percent: z.number(), weak: z.boolean() })),
        details: z.array(
          z.object({
            kind: z.enum(['question', 'task']),
            index: z.number().optional(),
            id: z.string().optional(),
            correct: z.boolean(),
            module: z.string(),
            explanation: nullableString.optional(),
          }),
        ),
      })
      .nullable(),
  }),
  exam: z.object({ id: z.number(), title: z.string(), pass_percent: z.number(), questions: z.array(questionSchema), course: courseRefSchema }),
})
export type ExamResult = z.infer<typeof examResultSchema>

const checkResultSchema = z.object({
  passed: z.boolean(),
  results: z.array(z.object({ passed: z.boolean(), message: z.string(), output: z.string().optional() })),
  newly_completed: z.boolean().optional(),
})
export type CheckResult = z.infer<typeof checkResultSchema>

const phpResultSchema = z.object({
  passed: z.boolean(),
  output: z.string(),
  results: z.array(z.object({ name: z.string(), passed: z.boolean(), message: z.string() })),
  newly_completed: z.boolean().optional(),
})
export type PhpResult = z.infer<typeof phpResultSchema>

const badgeSchema = z.object({ id: z.string(), title: z.string(), description: z.string(), icon: z.string(), earned: z.boolean() })
export type Badge = z.infer<typeof badgeSchema>

const dashboardSchema = z.object({
  continue: z
    .object({ lesson_slug: z.string(), lesson_title: z.string(), course_slug: z.string(), course_title: z.string(), color: nullableString, icon: nullableString })
    .nullable(),
  active_courses: z.array(
    z.object({ slug: z.string(), title: z.string(), icon: nullableString, color: nullableString, progress: progressSchema, next_lesson: lessonLinkSchema.nullable() }),
  ),
  stats: z.object({
    lessons_completed: z.number(),
    lessons_total: z.number(),
    terms_unlocked: z.number(),
    terms_total: z.number(),
    tasks_completed: z.number(),
    exams_passed: z.number(),
    streak: z.number(),
  }),
  activity: z.array(z.object({ day: z.string(), actions: z.number() })),
  badges: z.array(badgeSchema),
})
export type Dashboard = z.infer<typeof dashboardSchema>

const bookmarkSchema = z.object({ id: z.number(), type: z.string(), ref: z.string(), label: z.string(), url: z.string(), created_at: z.string() })
export type Bookmark = z.infer<typeof bookmarkSchema>

const workspaceChangeSchema = z.object({ path: z.string(), restart_required: z.boolean(), command: z.string() })

const folderListingSchema = z.object({
  path: z.string(),
  label: z.string(),
  parent: z.string().nullable(),
  entries: z.array(z.object({ name: z.string(), path: z.string(), workspace: z.boolean() })),
})
export type FolderListing = z.infer<typeof folderListingSchema>

const searchSchema = z.object({
  lessons: z.array(
    z.object({ slug: z.string(), title: z.string(), summary: nullableString, course_slug: z.string(), course_title: z.string(), excerpt: nullableString.optional() }),
  ),
  terms: z.array(z.object({ slug: z.string(), term: z.string(), short: z.string() })),
  courses: z.array(z.object({ slug: z.string(), title: z.string(), subtitle: nullableString, icon: nullableString, color: nullableString })),
})
export type SearchResult = z.infer<typeof searchSchema>

const ok = z.object({ ok: z.boolean() }).loose()
const sandboxStatusSchema = z.object({ ok: z.boolean(), workspace: z.boolean().optional(), tools: z.record(z.string(), z.string()).optional() })
export type SandboxStatus = z.infer<typeof sandboxStatusSchema>

export type TaskScope = { scope: 'lesson' | 'module'; id: number; task_id: string }

export const Api = {
  register: (body: { name: string; email: string; password: string }) => api('/auth/register', sessionSchema, { method: 'POST', body }),
  login: (body: { email: string; password: string }) => api('/auth/login', sessionSchema, { method: 'POST', body }),
  logout: () => api('/auth/logout', ok, { method: 'POST' }),
  me: () => api('/me', z.object({ user: userSchema })),
  updateMe: (body: { name?: string; password?: string; ui_variant?: 'standard' | 'apple' }) => api('/me', z.object({ user: userSchema }), { method: 'PATCH', body }),

  courses: (signal?: AbortSignal) => api('/courses', z.object({ courses: z.array(courseSummarySchema) }), { signal }),
  course: (slug: string, signal?: AbortSignal) => api(`/courses/${slug}`, z.object({ course: courseDetailSchema }), { signal }),
  lesson: (course: string, lesson: string, signal?: AbortSignal) => api(`/courses/${course}/lessons/${lesson}`, lessonSchema, { signal }),
  visitLesson: (id: number) => api(`/lessons/${id}/visit`, ok, { method: 'POST' }),
  completeLesson: (id: number) =>
    api(
      `/lessons/${id}/complete`,
      z.object({ ok: z.boolean(), newly_completed: z.boolean(), course_progress: progressSchema.nullable(), course_completed: z.boolean() }),
      { method: 'POST' },
    ),
  submitQuiz: (id: number, body: { score: number; max_score: number; answers: unknown[] }) => api(`/lessons/${id}/quiz`, ok, { method: 'POST', body }),
  saveNote: (id: number, body: string) => api(`/lessons/${id}/note`, ok, { method: 'PUT', body: { body } }),
  notes: () =>
    api(
      '/notes',
      z.object({
        notes: z.array(
          z.object({ id: z.number(), body: z.string(), updated_at: z.string(), lesson_slug: z.string(), lesson_title: z.string(), course_slug: z.string(), course_title: z.string() }),
        ),
      }),
    ),

  glossary: (signal?: AbortSignal) => api('/glossary', z.object({ terms: z.array(termSchema), unlocked_count: z.number(), total: z.number() }), { signal }),
  term: (slug: string, signal?: AbortSignal) =>
    api(`/glossary/${slug}`, z.object({ term: termSchema.extend({ related: z.array(z.object({ slug: z.string(), term: z.string(), short: z.string() })) }) }), { signal }),
  unlockTerms: (slugs: string[]) =>
    api(
      '/glossary/unlock',
      z.object({ unlocked: z.array(z.object({ slug: z.string(), term: z.string(), short: z.string() })), unlocked_count: z.number(), total: z.number() }),
      { method: 'POST', body: { slugs } },
    ),

  search: (q: string, signal?: AbortSignal) => api(`/search?q=${encodeURIComponent(q)}`, searchSchema, { signal }),

  completeTask: (scope: TaskScope) => api('/tasks/complete', z.object({ completed: z.boolean(), newly_completed: z.boolean() }), { method: 'POST', body: scope }),
  verifyTask: (scope: TaskScope) => api('/tasks/verify', checkResultSchema, { method: 'POST', body: scope }),
  resetTask: (scope: TaskScope) => api('/tasks/reset', z.object({ ok: z.boolean(), output: z.string() }), { method: 'POST', body: scope }),
  runPhp: (body: { scope: 'lesson' | 'module' | 'exam'; id: number; task_id: string; code: string }) => api('/tasks/run-php', phpResultSchema, { method: 'POST', body }),
  terminalSession: (course: string) => api(`/terminal/session?course=${encodeURIComponent(course)}`, z.object({ token: z.string(), workspace_dir: z.string(), url: z.string() })),
  sandboxStatus: () => api('/sandbox/status', sandboxStatusSchema),
  resetProgress: (includeNotesAndBookmarks: boolean) =>
    api('/settings/progress', z.object({ deleted: z.record(z.string(), z.number()) }), { method: 'DELETE', body: { include_notes_and_bookmarks: includeNotesAndBookmarks } }),

  project: (course: string, signal?: AbortSignal) => api(`/courses/${course}/project`, projectSchema, { signal }),
  verifyProjectStep: (project: number, step: string) => api(`/projects/${project}/steps/${step}/verify`, checkResultSchema, { method: 'POST' }),
  solveProjectStep: (project: number, step: string) =>
    api(`/projects/${project}/steps/${step}/solve`, checkResultSchema.extend({ output: z.string() }), { method: 'POST' }),
  resetProject: (project: number) => api(`/projects/${project}/reset`, z.object({ ok: z.boolean(), output: z.string() }), { method: 'POST' }),
  reopenProjectStep: (project: number, step: string) => api(`/projects/${project}/steps/${step}`, ok, { method: 'DELETE' }),

  exam: (course: string, signal?: AbortSignal) => api(`/courses/${course}/exam`, examInfoSchema, { signal }),
  startExam: (id: number) => api(`/exams/${id}/start`, examStartSchema, { method: 'POST' }),
  submitExam: (attempt: number, body: { answers: unknown[]; tasks: Record<string, { passed?: boolean; code?: string }> }) =>
    api(`/exam-attempts/${attempt}/submit`, examResultSchema, { method: 'POST', body }),
  examAttempt: (attempt: number, signal?: AbortSignal) => api(`/exam-attempts/${attempt}`, examResultSchema, { signal }),

  bookmarks: () => api('/bookmarks', z.object({ bookmarks: z.array(bookmarkSchema) })),
  toggleBookmark: (body: { type: string; ref: string; label: string; url: string }) =>
    api('/bookmarks/toggle', z.object({ bookmarked: z.boolean() }), { method: 'POST', body }),
  deleteBookmark: (id: number) => api(`/bookmarks/${id}`, ok, { method: 'DELETE' }),

  dashboard: (signal?: AbortSignal) => api('/dashboard', dashboardSchema, { signal }),
  workspace: () => api('/settings/workspace', z.object({ path: z.string(), writable: z.boolean(), browse: z.boolean().optional(), sandbox: sandboxStatusSchema })),
  updateWorkspace: (path: string) => api('/settings/workspace', workspaceChangeSchema, { method: 'PUT', body: { path } }),
  createWorkspace: (parent: string, name: string) => api('/settings/workspace', workspaceChangeSchema, { method: 'POST', body: { parent, name } }),
  folders: (path?: string, signal?: AbortSignal) =>
    api(`/settings/folders${path ? `?path=${encodeURIComponent(path)}` : ''}`, folderListingSchema, { signal }),
}
