import { computed, onMounted, onUnmounted, ref } from 'vue'
import { pageRegistry, type PagePath } from './page-registry'

function pathFromLocation(): PagePath {
  const path = window.location.hash.replace(/^#/, '')
  return pageRegistry.some((page) => page.path === path) ? path as PagePath : pageRegistry[0].path
}

export function useHashRouter() {
  const currentPath = ref<PagePath>(pageRegistry[0].path)
  const activePage = computed(() => pageRegistry.find((page) => page.path === currentPath.value) ?? pageRegistry[0])

  function readLocation() {
    currentPath.value = pathFromLocation()
  }

  onMounted(() => {
    readLocation()
    window.addEventListener('hashchange', readLocation)
  })

  onUnmounted(() => window.removeEventListener('hashchange', readLocation))

  return { currentPath, activePage }
}
