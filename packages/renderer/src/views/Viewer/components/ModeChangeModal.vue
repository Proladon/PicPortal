<template>
  <n-modal v-model:show="showModal" :on-update:show="updateModalShow">
    <div class="modal-content">
      <p>Mode Change</p>
      <div class="mode-btn-container">
        <div class="mode-btn" @click="changeView('VirtualList')">
          <n-icon>
            <ListSharp />
          </n-icon>
          <p>VirtualList View</p>
        </div>
        <div class="mode-btn" @click="changeView('VirtualGrid')">
          <n-icon>
            <AppsSharp />
          </n-icon>
          <p>VirtualGrid View</p>
        </div>
        <div class="mode-btn" @click="changeView('GridView')">
          <n-icon>
            <AppsSharp />
          </n-icon>
          <p>Grid View</p>
        </div>
        <div class="mode-btn" @click="changeView('FocusView')">
          <n-icon>
            <ImageOutline />
          </n-icon>

          <p>Focus View</p>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from '@vue/reactivity'
import { useRouter } from 'vue-router'
import { NModal, NIcon, NButton } from 'naive-ui/es'
import { AppsSharp, ListSharp, ImageOutline } from '@vicons/ionicons5'
import { useViewerStore } from '/@/store/viewerStore'
import { onMounted } from '@vue/runtime-core'

const emit = defineEmits(['close'])
const props = defineProps({
  mode: String,
  group: Object
})

const showModal = ref(false)
const router = useRouter()
const viewerStore = useViewerStore()

const updateModalShow = (show: boolean) => {
  if (!show) {
    setTimeout(() => {
      emit('close')
    }, 1500)
  }
  showModal.value = show
}

const closeModal = (): void => {
  showModal.value = false
  setTimeout(() => {
    emit('close')
  }, 150)
}

const changeView = (type: string): void => {
  viewerStore.SET_LAST_VIEWER_TYPE(type)
  closeModal()
  router.push({ name: type })
}

onMounted(() => {
  showModal.value = true
})
</script>

<style lang="postcss" scoped>
.modal-content {
  @apply p-5 text-center bg-primary-bg;
}

.mode-btn-container {
  @apply grid grid-cols-2 gap-5;
}
.mode-btn {
  @apply cursor-pointer flex items-center justify-start gap-3 whitespace-nowrap;
  @apply border-border border-solid border-1 p-10 rounded-md;
  @apply hover:bg-[var(--skyblue)];
}
</style>
