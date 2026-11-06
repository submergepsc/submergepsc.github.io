<script setup>
import { typeNames } from '../data.js'
import EntryMeta from './EntryMeta.vue'
defineProps({ entry: { type: Object, required: true }, featured: Boolean })
</script>
<template>
  <article
    class="entry-card"
    :class="{ 'featured-card': featured }"
    :data-entry-type="entry.type"
    :data-entry-category="entry.category"
    :data-entry-topic="entry.topic"
    :data-entry-stage="entry.stage"
  >
    <div class="card-kicker">
      <span class="type-mark">{{ typeNames[entry.type] }}</span
      ><span>{{ entry.category }}</span>
    </div>
    <h3>
      <RouterLink :to="entry.href">{{ entry.title }}</RouterLink>
    </h3>
    <p class="card-summary">{{ entry.summary }}</p>
    <EntryMeta :entry="entry" />
  </article>
</template>
