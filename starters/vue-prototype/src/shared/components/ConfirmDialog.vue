<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string; message: string; confirmLabel?: string }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const cancelButton = ref<HTMLButtonElement | null>(null)
const confirmButton = ref<HTMLButtonElement | null>(null)
let triggerElement: HTMLElement | null = null

watch(() => props.open, async (open) => {
  if (open) {
    triggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await nextTick()
    cancelButton.value?.focus()
    return
  }

  await nextTick()
  if (triggerElement?.isConnected) triggerElement.focus()
  triggerElement = null
})

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('cancel')
    return
  }

  if (event.key !== 'Tab') return

  const first = cancelButton.value
  const last = confirmButton.value
  if (!first || !last) return

  const activeElement = document.activeElement
  if (event.shiftKey && (activeElement === first || (activeElement !== last && activeElement !== first))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (activeElement === last || (activeElement !== first && activeElement !== last))) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <div v-if="open" class="dialog-backdrop" role="presentation" @click.self="emit('cancel')">
    <section class="confirm-dialog" role="alertdialog" aria-modal="true" :aria-label="title" :aria-describedby="'confirm-dialog-message'" @keydown="handleKeydown">
      <h2>{{ title }}</h2><p id="confirm-dialog-message">{{ message }}</p>
      <div class="dialog-actions"><button ref="cancelButton" class="button secondary" type="button" @click="emit('cancel')">取消</button><button ref="confirmButton" class="button primary" type="button" @click="emit('confirm')">{{ confirmLabel ?? '确认' }}</button></div>
    </section>
  </div>
</template>
