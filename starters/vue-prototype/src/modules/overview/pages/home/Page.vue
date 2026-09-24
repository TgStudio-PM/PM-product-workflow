<script setup lang="ts">
const principles = [
  { number: '01', title: '需求与页面分开迭代', description: '页面以目录组织；演示页面的说明与数据放在所属页面附近。' },
  { number: '02', title: '规则以事实文档为准', description: '材料申报页面遵循虚构案例中已确认的规则，页面代码不取代规则文档。' },
  { number: '03', title: '预览产物离线运行', description: '本模板示范把脚本和样式打入本地静态文件，再单独验证浏览器打开行为。' },
]
</script>

<template>
  <section class="page-intro">
    <div>
      <p class="eyebrow">TG STUDIO · VUE PROTOTYPE</p>
      <h1>原型工程概览</h1>
      <p class="lead">一个精简的 Vue + Vite 两页参考工程，用于验证热更新与离线静态构建路径。</p>
    </div>
    <span class="status-chip"><i></i>虚构教学示例</span>
  </section>

  <section class="summary-grid" aria-label="模板摘要">
    <article class="summary-card"><span>工程模式</span><strong>Vue 3 + Vite</strong><small>开发时使用热更新</small></article>
    <article class="summary-card"><span>离线入口</span><strong>相对路径静态包</strong><small>不加载外网资源</small></article>
    <article class="summary-card"><span>页面注册</span><strong>统一配置</strong><small>菜单、标题与组件对应</small></article>
  </section>

  <section class="panel">
    <div class="panel-heading"><div><span class="section-kicker">STARTER PRINCIPLES</span><h2>模板演示范围</h2></div><span class="panel-count">{{ principles.length }} 项</span></div>
    <div class="principle-list">
      <article v-for="item in principles" :key="item.number" class="principle-row">
        <span class="principle-number">{{ item.number }}</span>
        <div><strong>{{ item.title }}</strong><p>{{ item.description }}</p></div>
      </article>
    </div>
    <a class="inline-link" href="#/material-submission/apply">打开材料申报示例 <span aria-hidden="true">→</span></a>
  </section>

  <aside class="notice"><strong>当前阶段说明</strong><p>这里是技术可行性参考，不包含真实接口、鉴权、上传或生产业务处理。开发服务器和双击静态预览属于不同场景，需要分别验证。</p></aside>
</template>
