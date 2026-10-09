import { createBrowserRouter, redirect } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { RouteError } from '@/components/common/page-states'
import { getToken } from '@/lib/auth'
import { Api } from '@/lib/api'
import { HomePage } from '@/pages/home'
import { CoursesPage } from '@/pages/courses'
import { CoursePage } from '@/pages/course'
import { LessonPage } from '@/pages/lesson'
import { ProjectPage } from '@/pages/project'
import { ExamPage } from '@/pages/exam'
import { ExamResultPage } from '@/pages/exam-result'
import { GlossaryPage } from '@/pages/glossary'
import { TermPage } from '@/pages/term'
import { SearchPage } from '@/pages/search'
import { BookmarksPage } from '@/pages/bookmarks'
import { NotesPage } from '@/pages/notes'
import { LoginPage, RegisterPage } from '@/pages/auth'
import { SettingsPage } from '@/pages/settings'
import { NotFoundPage } from '@/pages/not-found'

function requireAuth({ request }: { request: Request }) {
  if (!getToken()) {
    const next = new URL(request.url).pathname
    throw redirect(`/anmelden?weiter=${encodeURIComponent(next)}`)
  }
  return null
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          {
            index: true,
            element: <HomePage />,
            loader: async ({ request }) => ({
              courses: (await Api.courses(request.signal)).courses,
              dashboard: getToken() ? await Api.dashboard(request.signal) : null,
            }),
          },
          { path: 'kurse', element: <CoursesPage />, loader: async ({ request }) => (await Api.courses(request.signal)).courses },
          { path: 'kurse/:course', element: <CoursePage />, loader: async ({ params, request }) => (await Api.course(params.course!, request.signal)).course },
          { path: 'kurse/:course/projekt', element: <ProjectPage />, loader: ({ params, request }) => Api.project(params.course!, request.signal) },
          { path: 'kurse/:course/pruefung', element: <ExamPage />, loader: ({ params, request }) => Api.exam(params.course!, request.signal) },
          {
            path: 'pruefungen/:attempt',
            element: <ExamResultPage />,
            loader: async (args) => {
              requireAuth(args)
              return Api.examAttempt(Number(args.params.attempt), args.request.signal)
            },
          },
          {
            path: 'kurse/:course/:lesson',
            element: <LessonPage />,
            loader: async ({ params, request }) => {
              const [lesson, course] = await Promise.all([Api.lesson(params.course!, params.lesson!, request.signal), Api.course(params.course!, request.signal)])
              return { ...lesson, outline: course.course }
            },
          },
          { path: 'lexikon', element: <GlossaryPage />, loader: ({ request }) => Api.glossary(request.signal) },
          { path: 'lexikon/:term', element: <TermPage />, loader: async ({ params, request }) => (await Api.term(params.term!, request.signal)).term },
          { path: 'suche', element: <SearchPage /> },
          { path: 'lesezeichen', element: <BookmarksPage />, loader: async (args) => (requireAuth(args), (await Api.bookmarks()).bookmarks) },
          { path: 'notizen', element: <NotesPage />, loader: async (args) => (requireAuth(args), (await Api.notes()).notes) },
          { path: 'einstellungen', element: <SettingsPage />, loader: async (args) => (requireAuth(args), Api.workspace()) },
          { path: 'anmelden', element: <LoginPage /> },
          { path: 'registrieren', element: <RegisterPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
