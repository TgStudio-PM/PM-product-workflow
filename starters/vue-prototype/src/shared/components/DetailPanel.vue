<script setup lang="ts">
defineProps<{ title: string; description: string; label?: string }>()
</script>

<template>
  <aside class="panel detail-panel" aria-label="页面详情">
    <p class="section-kicker">{{ label ?? 'DETAIL' }}</p>
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <slot />
  </aside>
</template>
