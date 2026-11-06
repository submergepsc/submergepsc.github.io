import { useHead } from '@unhead/vue'
import { computed, toValue } from 'vue'
import { useRoute } from 'vue-router'
import { site } from '../data.js'

export function usePageHead(title, description = site.subtitle, { article, noindex = false } = {}) {
  const route = useRoute()
  const canonical = computed(() => site.url + route.path)
  useHead(() => ({
    title: `${toValue(title)} · ${site.brand}`,
    link: [{ rel: 'canonical', href: canonical.value }],
    meta: [
      { name: 'description', content: toValue(description) },
      { property: 'og:title', content: `${toValue(title)} · ${site.brand}` },
      { property: 'og:description', content: toValue(description) },
      { property: 'og:url', content: canonical.value },
      { property: 'og:locale', content: 'zh_CN' },
      { property: 'og:type', content: article ? 'article' : 'website' },
      ...(noindex ? [{ name: 'robots', content: 'noindex,follow' }] : []),
    ],
    script: article
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: toValue(article).title,
              description: toValue(description),
              datePublished: toValue(article).date + 'T00:00:00+08:00',
              dateModified: (toValue(article).updated || toValue(article).date) + 'T00:00:00+08:00',
              author: { '@type': 'Person', name: site.author, url: site.url + '/about/' },
              mainEntityOfPage: canonical.value,
            }).replaceAll('<', '\\u003c'),
          },
        ]
      : [],
  }))
}
