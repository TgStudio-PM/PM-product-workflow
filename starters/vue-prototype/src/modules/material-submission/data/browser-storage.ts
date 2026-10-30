import type { MaterialId } from '../pages/apply/mock'

export interface ApplicationDraft {
  description: string
  checkedMaterials: MaterialId[]
  submitted: boolean
}

const STORAGE_KEY = 'tg-studio-vue-starter-material-submission-v1'

type ApplicationDraftReadResult =
  | { status: 'available'; draft: ApplicationDraft | null }
  | { status: 'invalid'; draft: null }
  | { status: 'unavailable'; draft: null }

export function readApplicationDraft(isMaterialId: (value: unknown) => value is MaterialId) {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { status: 'unavailable', draft: null } satisfies ApplicationDraftReadResult
  }

  if (raw === null) return { status: 'available', draft: null } satisfies ApplicationDraftReadResult

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { status: 'invalid', draft: null } satisfies ApplicationDraftReadResult
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { status: 'invalid', draft: null } satisfies ApplicationDraftReadResult
  }

  const saved = parsed as Partial<ApplicationDraft>
  return {
    status: 'available',
    draft: {
      description: typeof saved.description === 'string' ? saved.description : '',
      checkedMaterials: Array.isArray(saved.checkedMaterials) ? saved.checkedMaterials.filter(isMaterialId) : [],
      submitted: saved.submitted === true,
    },
  } satisfies ApplicationDraftReadResult
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
