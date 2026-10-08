<template>
  <div ref="dropZoneRef" class="native-drop-zone h-full">
    <n-button class="cursor-default h-full" dashed block>
      <n-icon size="24" :depth="3">
        <Archive />
      </n-icon>
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { useDropZone } from '@vueuse/core'
import { NButton, NIcon } from 'naive-ui'
import { Archive } from '@vicons/ionicons5'
import { ref, onMounted, onUnmounted } from 'vue'
import { useDesktop } from '/@/desktop'
import { reportDesktopError } from '/@/desktop/status'

const dropZoneRef = ref<HTMLDivElement>()
const emit = defineEmits(['drop', 'paths'])
const props = defineProps({ projects: Boolean })
const desktop = useDesktop()
let disposed = false
let unlisten: (() => void) | undefined
const mountedAt = Date.now()
onMounted(async () => {
  if (desktop.runtime !== 'tauri') return
  try {
    const stop = await desktop.onFileDrop((drop) => {
      const bounds = dropZoneRef.value?.getBoundingClientRect()
      if (
        !bounds ||
        disposed ||
        drop.time < mountedAt ||
        drop.x < bounds.left ||
        drop.x > bounds.right ||
        drop.y < bounds.top ||
        drop.y > bounds.bottom
      )
        return
      const paths = drop.paths
        .filter((p) =>
          props.projects ? !p.directory && /\.db$/i.test(p.path) : p.directory
        )
        .map((p) => p.path)
      if (paths.length) emit('paths', paths)
    })
    if (disposed) stop()
    else unlisten = stop
  } catch (error) {
    reportDesktopError(error)
  }
})
onUnmounted(() => {
  disposed = true
  unlisten?.()
})

const onDrop = (files: File[] | null) => {
  if (desktop.runtime === 'tauri') return
  emit('drop', files)
}

const { isOverDropZone } = useDropZone(dropZoneRef, onDrop)
</script>

<style scoped lang="postcss"></style>
