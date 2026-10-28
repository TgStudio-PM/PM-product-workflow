import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { pageRegistry } from './page-registry'
import { resolveHashLocation } from './hash-location'

export function useHashRouter() {
  const currentPath = ref<string>(pageRegistry[0].path)
  const query = shallowRef(new URLSearchParams())
  const activePage = computed(() => pageRegistry.find((page) => page.path === currentPath.value))

  function readLocation() {
    const location = resolveHashLocation(window.location.hash, pageRegistry.map((page) => page.path))
    currentPath.value = location.path
    query.value = location.query
  }

  onMounted(() => {
    readLocation()
    window.addEventListener('hashchange', readLocation)
  })

  onUnmounted(() => window.removeEventListener('hashchange', readLocation))

  return { currentPath, query, activePage }
}
