<script setup lang="ts">
import type { TableColumn, TableRow } from './table-types'

const props = withDefaults(defineProps<{
  columns: readonly TableColumn[]
  rows: readonly TableRow[]
  selectedId?: string
  rowLabelKey?: string
  emptyText?: string
}>(), {
  emptyText: '暂无数据',
})

const emit = defineEmits<{ select: [id: string] }>()

function getRowLabel(row: TableRow): string {
  const explicitLabel = props.rowLabelKey ? row.cells[props.rowLabelKey]?.trim() : ''
  const firstColumnLabel = props.columns.length > 0 ? row.cells[props.columns[0].key]?.trim() : ''
  return explicitLabel || firstColumnLabel || row.id.trim() || '该项'
}
</script>

<template>
  <div class="data-table-wrap">
    <table class="data-table">
      <thead><tr><th v-for="column in columns" :key="column.key" scope="col">{{ column.label }}</th><th scope="col">操作</th></tr></thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id" :class="{ selected: selectedId === row.id }">
          <td v-for="column in columns" :key="column.key">{{ row.cells[column.key] }}</td>
          <td><button class="table-link" type="button" :aria-label="`查看${getRowLabel(row)}`" @click="emit('select', row.id)">查看</button></td>
        </tr>
        <tr v-if="rows.length === 0"><td class="empty-cell" :colspan="columns.length + 1">{{ emptyText }}</td></tr>
      </tbody>
    </table>
  </div>
</template>
