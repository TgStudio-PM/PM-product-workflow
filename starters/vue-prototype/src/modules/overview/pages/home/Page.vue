<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTable from '../../../../shared/components/DataTable.vue'
import type { TableRow } from '../../../../shared/components/table-types'
import DetailPanel from '../../../../shared/components/DetailPanel.vue'
import QuerySection from '../../../../shared/components/QuerySection.vue'
import { pageRegistry } from '../../../../app/page-registry'
import { overviewMock } from './mock'

const query = ref('')
const appliedQuery = ref('')
const selectedPath = ref<string>(pageRegistry[0].path)
const rows = computed<TableRow[]>(() => pageRegistry
  .filter((page) => `${page.title} ${page.menuLabel} ${page.description}`.toLocaleLowerCase().includes(appliedQuery.value.trim().toLocaleLowerCase()))
  .map((page) => ({ id: page.path, cells: { title: page.title, menu: page.menuLabel, role: page.demoRole } })))
const selectedPage = computed(() => pageRegistry.find((page) => page.path === selectedPath.value) ?? pageRegistry[0])

function resetQuery() {
  query.value = ''
  appliedQuery.value = ''
}

function searchPages() {
  appliedQuery.value = query.value
}
</script>

<template>
  <section class="page-intro">
    <div>
      <p class="eyebrow">TG STUDIO · VUE PROTOTYPE</p>
      <h1>原型工程概览</h1>
      <p class="lead">一个精简的 Vue + Vite 参考工程，用于验证页面快速迭代与离线静态预览。</p>
    </div>
    <span class="status-chip"><i></i>虚构教学示例</span>
  </section>

  <section class="summary-grid" aria-label="模板摘要">
    <article v-for="item in overviewMock.summary" :key="item.label" class="summary-card"><span>{{ item.label }}</span><strong>{{ item.value }}</strong><small>{{ item.note }}</small></article>
  </section>

  <div class="overview-workspace">
    <div class="overview-main">
      <QuerySection v-model="query" label="页面名称或说明" placeholder="输入页面名称或关键词" @search="searchPages" @reset="resetQuery" />
      <section class="panel registry-panel">
        <div class="panel-heading"><div><span class="section-kicker">PAGE REGISTRY</span><h2>页面清单</h2></div><span class="panel-count">{{ rows.length }} 个页面</span></div>
        <DataTable :columns="overviewMock.columns" :rows="rows" :selected-id="selectedPath" @select="selectedPath = $event" />
      </section>
    </div>
    <DetailPanel :title="selectedPage.title" :description="selectedPage.description" label="PAGE DETAILS">
      <dl class="page-detail-list"><dt>页面路径</dt><dd>{{ selectedPage.path }}</dd><dt>演示角色标识</dt><dd>{{ selectedPage.demoRole }}</dd><dt>说明</dt><dd>该角色仅用于展示页面上下文，不执行真实鉴权。</dd></dl>
      <a class="inline-link" :href="`#${selectedPage.path}`">打开页面 <span aria-hidden="true">→</span></a>
    </DetailPanel>
  </div>

  <aside class="notice"><strong>当前阶段说明</strong><p>这里是技术参考，不包含真实接口、鉴权、上传或生产业务处理。开发服务器和双击静态预览属于不同场景，需要分别验证。</p></aside>
</template>
