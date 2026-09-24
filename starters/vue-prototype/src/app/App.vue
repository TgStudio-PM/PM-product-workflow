<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { pageRegistry, type PagePath } from './page-registry'

const currentPath = ref<PagePath>('/overview')
const activePage = computed(() => pageRegistry.find((page) => page.path === currentPath.value) ?? pageRegistry[0])

function readLocation() {
  const path = window.location.hash.replace(/^#/, '')
  currentPath.value = pageRegistry.some((page) => page.path === path) ? path as PagePath : '/overview'
}

onMounted(() => {
  readLocation()
  window.addEventListener('hashchange', readLocation)
})

onUnmounted(() => window.removeEventListener('hashchange', readLocation))
</script>

<template>
  <div class="demo-banner">
    <span class="demo-dot" aria-hidden="true"></span>
    Tg Studio 虚构教学原型 · 不对应真实政务服务，不上传文件、不发起网络请求
  </div>
  <header class="site-header">
    <a class="brand" href="#/overview" aria-label="Tg Studio 原型概览">
      <span class="brand-mark" aria-hidden="true">Tg</span>
      <span><strong>Tg Studio</strong><small>PROTOTYPE STARTER</small></span>
    </a>
    <span class="header-meta">Coding Agent 原型工程参考</span>
  </header>

  <div class="layout">
    <aside class="sidebar" aria-label="演示导航">
      <p class="nav-caption">原型演示</p>
      <a
        v-for="page in pageRegistry"
        :key="page.path"
        class="nav-link"
        :class="{ active: currentPath === page.path }"
        :href="`#${page.path}`"
      >
        <span class="nav-mark" aria-hidden="true"></span>{{ page.menuLabel }}
      </a>
      <div class="sidebar-note">
        <span>演示角色</span>
        <strong>{{ activePage.demoRole }}</strong>
        <small>仅用于说明原型页面上下文，不代表真实身份认证。</small>
      </div>
    </aside>

    <main class="main-content">
      <div class="breadcrumbs"><a href="#/overview">首页</a><span>/</span><strong>{{ activePage.title }}</strong></div>
      <component :is="activePage.component" />
      <footer class="page-footer">
        <span>Tg Studio · 虚构教学原型</span>
        <span>页面注册表驱动导航 · Hash 路由</span>
      </footer>
    </main>
  </div>
</template>
