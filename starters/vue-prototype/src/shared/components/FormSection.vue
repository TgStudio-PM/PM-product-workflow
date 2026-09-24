<script setup lang="ts">
defineProps<{ title: string; kicker?: string }>()
</script>

<template>
  <section class="panel form-section">
    <div class="panel-heading"><div><span v-if="kicker" class="section-kicker">{{ kicker }}</span><h2>{{ title }}</h2></div><slot name="status" /></div>
    <slot />
  </section>
</template>
