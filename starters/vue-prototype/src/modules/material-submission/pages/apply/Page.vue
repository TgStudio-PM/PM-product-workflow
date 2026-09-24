<script setup lang="ts">
import { computed, ref } from 'vue'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog.vue'
import FormSection from '../../../../shared/components/FormSection.vue'
import { useApplicationDraft } from '../../data/use-application-draft'
import { applicationMock, type MaterialId } from './mock'

const requiredMaterials = applicationMock.materials.filter((material) => material.required)
const requiredIds = requiredMaterials.map((material) => material.id) as MaterialId[]
const {
  draft, storageReady, storageMessage, showDescriptionError, showMaterialsError,
  requiredCheckedCount, descriptionCount, persistDraft, resetDraft, submitDraft,
} = useApplicationDraft(isMaterialId, requiredIds)
const resetDialogOpen = ref(false)
const submitted = computed(() => draft.submitted)

function isMaterialId(value: unknown): value is MaterialId {
  return applicationMock.materials.some((material) => material.id === value)
}

function saveDraft() {
  persistDraft()
}

function submitApplication() {
  submitDraft()
}

async function confirmReset() {
  await resetDraft()
  resetDialogOpen.value = false
}
</script>

<template>
  <section class="page-intro">
    <div>
      <p class="eyebrow">MATTER APPLICATION · FICTIONAL DEMO</p>
      <h1>材料申报</h1>
      <p class="lead">填写虚构教学内容并确认材料准备情况。这里仅演示本地表单交互。</p>
    </div>
    <span class="status-chip" :class="{ submitted }"><i></i>{{ submitted ? '已提交' : '草稿' }}</span>
  </section>

  <div class="application-layout">
    <FormSection title="填写申报信息" kicker="APPLICATION FORM" class="form-panel">
      <template #status><span class="draft-status" :class="{ warning: !storageReady }">{{ storageMessage }}</span></template>
      <form novalidate @submit.prevent="submitApplication">
        <label class="field-label" for="matter-name">申报事项 <span>*</span></label>
        <input id="matter-name" class="text-input readonly" :value="applicationMock.matterName" readonly>
        <small class="field-hint">本教学案例中的固定事项名称。</small>

        <label class="field-label description-label" for="application-description">申请说明 <span>*</span></label>
        <textarea
          id="application-description"
          v-model="draft.description"
          class="text-input description-input"
          maxlength="500"
          placeholder="请填写虚构示例说明，不要填写真实个人或机构信息。"
          :disabled="submitted"
          :aria-invalid="showDescriptionError"
          @input="showDescriptionError = false"
        ></textarea>
        <div class="field-meta"><small>去除首尾空白后必填，最多 500 字。</small><small>{{ descriptionCount }} / 500</small></div>
        <p v-if="showDescriptionError" class="field-error" role="alert">请填写申请说明后再提交。</p>

        <div class="materials-heading">
          <div><strong>申报材料</strong><small>勾选表示已备齐，不会上传文件。</small></div>
          <span>{{ requiredCheckedCount }} / {{ requiredMaterials.length }} 项必备材料已确认</span>
        </div>
        <fieldset class="material-list" :disabled="submitted" :aria-invalid="showMaterialsError">
          <legend class="visually-hidden">确认材料准备情况</legend>
          <label v-for="material in applicationMock.materials" :key="material.id" class="material-row">
            <input v-model="draft.checkedMaterials" type="checkbox" :value="material.id">
            <span class="custom-check" aria-hidden="true"></span>
            <span class="material-copy"><strong>{{ material.name }}</strong><small>{{ material.description }}</small></span>
            <span class="material-tag" :class="material.required ? 'required' : 'optional'">{{ material.required ? '必备' : '可选' }}</span>
          </label>
        </fieldset>
        <p v-if="showMaterialsError" class="field-error" role="alert">请确认已备齐全部 {{ requiredMaterials.length }} 项必备演示材料。</p>

        <div class="form-actions">
          <button class="button secondary" type="button" :disabled="submitted" @click="saveDraft">暂存草稿</button>
          <button class="button primary" type="submit" :disabled="submitted">{{ submitted ? '已完成提交' : '确认并提交' }} <span aria-hidden="true">→</span></button>
        </div>
      </form>
      <div v-if="submitted" class="submitted-note" role="status"><strong>演示提交完成</strong><span>本地状态已锁定；没有向服务发送数据。</span></div>
    </FormSection>

    <aside class="side-column">
      <section class="panel side-panel">
        <p class="section-kicker">CONFIRMED RULES</p>
        <h2>材料准备要求</h2>
        <ul class="rule-list">
          <li v-for="material in applicationMock.materials" :key="material.id">
            <span class="rule-bullet" :class="{ optional: !material.required }"></span>
            <span><strong>{{ material.name }}</strong><small>{{ material.required ? '提交前须确认已备齐' : '可按需确认，不影响提交' }}</small></span>
          </li>
        </ul>
        <p class="side-footnote">此原型不收取文件，也不代表真实办件。</p>
      </section>
      <section class="panel side-panel reset-panel">
        <p class="section-kicker">LOCAL DEMO DATA</p>
        <h2>清除演示数据</h2>
        <p>只移除本页专用的浏览器存储记录。清除操作会先请求确认。</p>
        <button class="button text-button" type="button" @click="resetDialogOpen = true">清除并重新开始 <span aria-hidden="true">↗</span></button>
      </section>
    </aside>
  </div>

  <ConfirmDialog
    :open="resetDialogOpen"
    title="清除演示数据"
    message="只清除本示例在当前浏览器保存的数据，并返回空白草稿。是否继续？"
    confirm-label="清除并重置"
    @cancel="resetDialogOpen = false"
    @confirm="confirmReset"
  />
</template>
