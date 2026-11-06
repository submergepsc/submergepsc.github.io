import { entries, projects, series, tools } from './data.js'
import Home from './pages/HomePage.vue'
import Garden from './pages/GardenPage.vue'
import Article from './pages/ArticlePage.vue'
import ProjectIndex from './pages/ProjectsPage.vue'
import Project from './pages/ProjectPage.vue'
import Repositories from './pages/RepositoriesPage.vue'
import ToolIndex from './pages/ToolsPage.vue'
import Tool from './pages/ToolPage.vue'
import Search from './pages/SearchPage.vue'
import Collections from './pages/CollectionsPage.vue'
import Info from './pages/InfoPage.vue'
import NotFound from './pages/NotFoundPage.vue'

export const routes = [
  { path: '/', component: Home },
  { path: '/garden/', component: Garden },
  { path: '/projects/', component: ProjectIndex },
  { path: '/projects/repositories/', component: Repositories },
  { path: '/tools/', component: ToolIndex },
  { path: '/search/', component: Search },
  ...['journal', 'about', 'now'].map((kind) => ({
    path: `/${kind}/`,
    component: Info,
    props: { kind },
  })),
  ...['series', 'archive'].map((kind) => ({
    path: `/${kind}/`,
    component: Collections,
    props: { kind },
  })),
  ...entries.map((entry) => ({
    path: entry.href,
    component: Article,
    props: { slug: entry.slug },
  })),
  ...projects.map((project) => ({
    path: project.href,
    component: Project,
    props: { slug: project.slug },
  })),
  ...series.map((item) => ({
    path: item.href,
    component: Collections,
    props: { kind: 'series-detail', slug: item.slug },
  })),
  ...tools.map((tool) => ({
    path: `/tools/${tool.slug}/`,
    component: Tool,
    props: { slug: tool.slug },
  })),
  { path: '/404.html', component: NotFound },
  { path: '/:pathMatch(.*)*', component: NotFound },
]
