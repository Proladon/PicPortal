<template>
  <div
    v-if="loading"
    class="view-loading flex h-full w-full items-center justify-center text-muted-foreground"
  >
    <Spinner class="size-6" />
  </div>
  <Empty v-else class="view-empty h-full">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <FolderSearch v-if="!hasFolder" />
        <ImageOff v-else />
      </EmptyMedia>
      <EmptyTitle>
        {{
          hasFolder ? t('viewer.empty.title') : t('viewer.empty.noFolderTitle')
        }}
      </EmptyTitle>
      <EmptyDescription>
        {{
          hasFolder
            ? t('viewer.empty.description')
            : t('viewer.empty.noFolderDescription')
        }}
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="!hasFolder && !appStore.readOnly">
      <Button size="sm" @click="choseMainFolder">
        <FolderOpen />
        {{ t('viewer.empty.chooseFolder') }}
      </Button>
    </EmptyContent>
  </Empty>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FolderOpen, FolderSearch, ImageOff } from '@lucide/vue'
import { Button } from '/@/components/ui/button'
import { Spinner } from '/@/components/ui/spinner'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '/@/components/ui/empty'
import { useAppStore } from '/@/store/appStore'
import { useMainFolder } from '/@/use/mainFolder'

defineProps({ loading: Boolean })

const { t } = useI18n()
const appStore = useAppStore()
const { choseMainFolder } = useMainFolder()
const hasFolder = computed(() => Boolean(appStore.projectMainFolder.path))
</script>
