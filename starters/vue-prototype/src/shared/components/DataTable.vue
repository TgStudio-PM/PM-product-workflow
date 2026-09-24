<script setup lang="ts">
import type { TableColumn, TableRow } from './table-types'

defineProps<{ columns: readonly TableColumn[]; rows: readonly TableRow[]; selectedId?: string }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="data-table-wrap">
    <table class="data-table">
      <thead><tr><th v-for="column in columns" :key="column.key" scope="col">{{ column.label }}</th><th scope="col">操作</th></tr></thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id" :class="{ selected: selectedId === row.id }">
          <td v-for="column in columns" :key="column.key">{{ row.cells[column.key] }}</td>
          <td><button class="table-link" type="button" :aria-label="`查看${row.cells.title}`" @click="emit('select', row.id)">查看</button></td>
        </tr>
        <tr v-if="rows.length === 0"><td class="empty-cell" :colspan="columns.length + 1">没有匹配的页面</td></tr>
      </tbody>
    </table>
  </div>
</template>
