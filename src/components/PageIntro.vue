<script setup>
defineProps({ eyebrow: String, title: String, accent: String, description: String })
</script>
<template>
  <section class="page-intro shell">
    <span v-if="eyebrow" class="section-overline">{{ eyebrow }}</span>
    <h1>
      {{ title
      }}<template v-if="accent"
        ><br /><i>{{ accent }}</i></template
      >
    </h1>
    <p v-if="description">{{ description }}</p>
    <slot />
  </section>
</template>
