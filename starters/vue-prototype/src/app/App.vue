<script setup lang="ts">
import { pageRegistry } from './page-registry'
import { useHashRouter } from './router'

const { currentPath, query, activePage } = useHashRouter()
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
        :aria-current="currentPath === page.path ? 'page' : undefined"
        :href="`#${page.path}`"
      >
        <span class="nav-mark" aria-hidden="true"></span>{{ page.menuLabel }}
      </a>
      <div v-if="activePage" class="sidebar-note">
        <span>演示角色</span>
        <strong>{{ activePage.demoRole }}</strong>
        <small>仅用于说明原型页面上下文，不代表真实身份认证。</small>
      </div>
    </aside>

    <main class="main-content">
      <template v-if="activePage">
        <div class="breadcrumbs"><a href="#/overview">首页</a><span>/</span><strong>{{ activePage.title }}</strong></div>
        <component :is="activePage.component" />
      </template>
      <template v-else>
        <div class="breadcrumbs"><a href="#/overview">首页</a><span>/</span><strong>页面未找到</strong></div>
        <section class="panel template-content not-found-panel" aria-labelledby="not-found-title">
          <h1 id="not-found-title">页面未找到</h1>
          <p>当前原型未登记该地址：</p>
          <code class="not-found-path">{{ currentPath }}<template v-if="query.size">?{{ query.toString() }}</template></code>
          <p>你可以返回已有页面：</p>
          <ul class="not-found-links">
            <li v-for="page in pageRegistry" :key="page.path"><a :href="`#${page.path}`">{{ page.title }}</a></li>
          </ul>
        </section>
      </template>
      <footer class="page-footer">
        <span>Tg Studio · 虚构教学原型</span>
        <span>页面注册表驱动导航 · Hash 路由</span>
      </footer>
    </main>
  </div>
</template>
