<script setup lang="ts">
defineProps<{ open: boolean; title: string; message: string; confirmLabel?: string }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div v-if="open" class="dialog-backdrop" role="presentation" @click.self="emit('cancel')">
    <section class="confirm-dialog" role="alertdialog" aria-modal="true" :aria-label="title" :aria-describedby="'confirm-dialog-message'">
      <h2>{{ title }}</h2><p id="confirm-dialog-message">{{ message }}</p>
      <div class="dialog-actions"><button class="button secondary" type="button" @click="emit('cancel')">取消</button><button class="button primary" type="button" @click="emit('confirm')">{{ confirmLabel ?? '确认' }}</button></div>
    </section>
  </div>
</template>
