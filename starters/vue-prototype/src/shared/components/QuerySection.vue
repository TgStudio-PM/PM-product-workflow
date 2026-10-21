<script setup lang="ts">
defineProps<{ label: string; placeholder?: string }>()
const model = defineModel<string>({ required: true })
const emit = defineEmits<{ reset: []; search: [] }>()

function searchOnEnter(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) return
  event.preventDefault()
  emit('search')
}
</script>

<template>
  <section class="panel query-section" aria-label="查询条件">
    <label class="query-field"><span>{{ label }}</span><input v-model="model" class="text-input" :placeholder="placeholder" @keydown.enter="searchOnEnter"></label>
    <div class="query-actions"><button class="button primary" type="button" @click="emit('search')">查询</button><button class="button secondary" type="button" @click="emit('reset')">重置</button></div>
  </section>
</template>
