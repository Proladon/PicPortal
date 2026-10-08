<template>
  <div
    ref="dropZoneRef"
    class="native-drop-zone flex min-h-12 items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-sm text-muted-foreground transition-colors"
    :class="
      isOverDropZone
        ? 'border-primary bg-primary/5 text-primary'
        : 'border-border bg-muted/20'
    "
  >
    <slot>
      <FolderInput class="size-5 shrink-0 opacity-70" />
      <span v-if="hint" class="truncate">{{ hint }}</span>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useDropZone } from '@vueuse/core'
import { FolderInput } from '@lucide/vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { useDesktop } from '/@/desktop'
import { reportDesktopError } from '/@/desktop/status'

const dropZoneRef = ref<HTMLDivElement>()
const emit = defineEmits(['drop', 'paths'])
const props = defineProps({
  projects: Boolean,
  hint: { type: String, default: '' },
})
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
