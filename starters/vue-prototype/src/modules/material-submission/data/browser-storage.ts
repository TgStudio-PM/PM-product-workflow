import type { MaterialId } from '../pages/apply/mock'

export interface ApplicationDraft {
  description: string
  checkedMaterials: MaterialId[]
  submitted: boolean
}

const STORAGE_KEY = 'tg-studio-vue-starter-material-submission-v1'

export function readApplicationDraft(isMaterialId: (value: unknown) => value is MaterialId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { draft: null, available: true }
    const saved = JSON.parse(raw) as Partial<ApplicationDraft>
    return {
      draft: {
        description: typeof saved.description === 'string' ? saved.description.slice(0, 500) : '',
        checkedMaterials: Array.isArray(saved.checkedMaterials) ? saved.checkedMaterials.filter(isMaterialId) : [],
        submitted: saved.submitted === true,
      },
      available: true,
    }
  } catch {
    return { draft: null, available: false }
  }
}

export function writeApplicationDraft(draft: ApplicationDraft): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export function removeApplicationDraft(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
