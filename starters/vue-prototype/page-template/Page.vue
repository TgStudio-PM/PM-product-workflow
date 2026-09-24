<script setup lang="ts">
import { pageMock } from './mock'
</script>

<template>
  <section class="page-intro">
    <div><p class="eyebrow">TG STUDIO · NEW PAGE</p><h1>{{ pageMock.title }}</h1><p class="lead">{{ pageMock.description }}</p></div>
    <span class="status-chip"><i></i>待接入页面</span>
  </section>
  <section class="panel template-content"><h2>开始页面迭代</h2><p>在此页面目录内编写视图，并在同目录维护 mock 数据与 RULES.md 索引。</p></section>
</template>
