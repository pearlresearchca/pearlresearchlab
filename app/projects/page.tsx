import type { Metadata } from 'next'
import { ProjectsPage } from '@/components/pearl-pages'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Explore the projects where PEARL researchers and partners are working together to make health systems and communities more equitable.',
  alternates: { canonical: '/projects' },
}

export default ProjectsPage
