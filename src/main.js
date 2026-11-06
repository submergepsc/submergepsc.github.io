import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router.js'
import './styles/site.css'
import './styles/toolbox.css'
import './styles/vue.css'

export const createApp = ViteSSG(App, {
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: 90 }
    if (to.path === from.path) return false
    return { top: 0 }
  },
})
