import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import type { MaterialId } from '../pages/apply/mock'
import { readApplicationDraft, removeApplicationDraft, writeApplicationDraft, type ApplicationDraft } from './browser-storage'

export function useApplicationDraft(isMaterialId: (value: unknown) => value is MaterialId, requiredIds: MaterialId[]) {
  const draft = reactive<ApplicationDraft>({ description: '', checkedMaterials: [], submitted: false })
  const storageReady = ref(true)
  const storageMessage = ref('草稿暂存于当前浏览器')
  const showDescriptionError = ref(false)
  const showMaterialsError = ref(false)
  const suppressAutoSave = ref(false)
  const requiredCheckedCount = computed(() => requiredIds.filter((id) => draft.checkedMaterials.includes(id)).length)
  const descriptionCount = computed(() => draft.description.length)

  function setStorageState(available: boolean, message?: string) {
    storageReady.value = available
    storageMessage.value = message ?? (available ? '草稿已暂存于当前浏览器' : '浏览器存储不可用；草稿未保存')
  }

  function persistDraft(): boolean {
    const saved = writeApplicationDraft(draft)
    setStorageState(saved)
    return saved
  }

  async function resetDraft(): Promise<boolean> {
    if (!removeApplicationDraft()) {
      setStorageState(false, '无法清除浏览器数据；页面内容未重置')
      return false
    }
    suppressAutoSave.value = true
    draft.description = ''
    draft.checkedMaterials = []
    draft.submitted = false
    showDescriptionError.value = false
    showMaterialsError.value = false
    setStorageState(true, '草稿暂存于当前浏览器')
    await nextTick()
    suppressAutoSave.value = false
    return true
  }

  function submitDraft(): boolean {
    showDescriptionError.value = !draft.description.trim()
    showMaterialsError.value = requiredCheckedCount.value !== requiredIds.length
    if (showDescriptionError.value || showMaterialsError.value) return false
    draft.submitted = true
    if (!persistDraft()) {
      draft.submitted = false
      return false
    }
    return true
  }

  watch(() => [draft.description, [...draft.checkedMaterials]], () => {
    if (!draft.submitted && !suppressAutoSave.value) persistDraft()
  }, { deep: true })

  onMounted(async () => {
    suppressAutoSave.value = true
    const loaded = readApplicationDraft(isMaterialId)
    if (loaded.draft) Object.assign(draft, loaded.draft)
    if (!loaded.available) setStorageState(false, '无法读取本地草稿；当前内容不会持久保存')
    await nextTick()
    suppressAutoSave.value = false
  })

  return {
    draft, storageReady, storageMessage, showDescriptionError, showMaterialsError,
    requiredCheckedCount, descriptionCount, persistDraft, resetDraft, submitDraft,
  }
}
