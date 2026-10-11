import { useEffect } from 'react'
import { useLoaderData } from 'react-router'
import { Dashboard as StandardDashboard } from '@/components/dashboard/dashboard'
import { Landing } from '@/components/landing/landing'
import type { CourseSummary, Dashboard } from '@/lib/api'
import { useSession } from '@/lib/auth'

export function HomePage() {
  const { courses, dashboard } = useLoaderData() as { courses: CourseSummary[]; dashboard: Dashboard | null }
  const user = useSession()

  useEffect(() => {
    document.title = 'Stacklab – IT lernen durch echtes Tippen'
  }, [])

  if (user && dashboard) {
    return <StandardDashboard dashboard={dashboard} courses={courses} name={user.name} />
  }
  return <Landing courses={courses} />
}
