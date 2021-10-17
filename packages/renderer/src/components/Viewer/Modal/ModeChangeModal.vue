<template>
  <GDialog v-model="showModal" max-width="40%" @update:modelValue="closeModal">
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
  </GDialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from '@vue/reactivity'
import { GDialog } from 'gitart-vue-dialog'
import { useRouter } from 'vue-router'
import { NIcon, NButton } from 'naive-ui'
import { AppsSharp, ListSharp, ImageOutline } from '@vicons/ionicons5'

const emit = defineEmits(['close'])
const props = defineProps({
  mode: String,
  group: Object,
})

const showModal = ref(true)
const router = useRouter()

const closeModal = (): void => {
  showModal.value = false
  setTimeout(() => {
    emit('close')
  }, 150)
}

const changeView = (view: string): void => {
  router.push({ name: view })
  closeModal()
}
</script>

<style lang="postcss" scoped>
.modal-content {
  @apply p-5 text-center;
}

.mode-btn-container {
  @apply grid grid-cols-2 gap-5;
}
.mode-btn {
  @apply cursor-pointer flex items-center justify-start gap-3 whitespace-nowrap;
  @apply border-border border-solid border-1 p-2 rounded-md;
  @apply hover:bg-[var(--skyblue)];
}
</style>
