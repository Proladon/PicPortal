<template>
  <div class="layout flex h-full w-full flex-col bg-background text-foreground">
    <TitleBar />

    <div
      v-if="desktopError"
      class="desktop-status flex shrink-0 items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-3 py-1.5 text-sm text-destructive"
      role="alert"
    >
      <TriangleAlert class="size-4 shrink-0" />
      <p class="min-w-0 flex-1 break-all">{{ desktopError }}</p>
      <Button
        variant="ghost"
        size="icon-xs"
        :aria-label="t('common.dismiss')"
        @click="desktopError = ''"
      >
        <X />
      </Button>
    </div>

    <div
      v-if="closeWaiting"
      class="close-waiting flex shrink-0 items-center gap-2 border-b bg-muted/60 px-3 py-1.5 text-sm"
      role="status"
    >
      <Spinner class="text-muted-foreground" />
      <p class="flex-1">{{ t('app.close.waiting') }}</p>
      <Button variant="outline" size="xs" @click="cancelClose">
        {{ t('app.close.cancel') }}
      </Button>
    </div>

    <section class="main-wrapper flex min-h-0 flex-1">
      <Navbar />
      <main class="relative min-w-0 flex-1 overflow-hidden">
        <router-view />
      </main>
    </section>

    <StatusBar />

    <AlertDialog :open="closePrompt">
      <AlertDialogContent @escape-key-down.prevent>
        <AlertDialogHeader>
          <AlertDialogMedia class="bg-primary/10 text-primary">
            <LogOut />
          </AlertDialogMedia>
          <AlertDialogTitle>{{ t('app.close.title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{
              settingsDirty
                ? t('app.close.settingsDirty')
                : t('app.close.batchRunning')
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="close-actions">
          <Button variant="outline" @click="cancelClose">
            {{ t('app.close.keepUsing') }}
          </Button>
          <Button v-if="settingsDirty" @click="finishClose(true)">
            {{ t('app.close.saveAndClose') }}
          </Button>
          <Button
            :variant="settingsDirty ? 'destructive' : 'secondary'"
            @click="finishClose(false)"
          >
            {{
              settingsDirty
                ? t('app.close.discardAndClose')
                : t('app.close.closeAfterBatch')
            }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <div
      v-if="closing"
      class="loading-overlay absolute inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-background/80 text-sm text-muted-foreground backdrop-blur-sm"
    >
      <Spinner class="size-6" />
      {{ t('app.close.closing') }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { LogOut, TriangleAlert, X } from '@lucide/vue'
import TitleBar from './components/TitleBar.vue'
import Navbar from './components/NavBar.vue'
import StatusBar from './components/StatusBar.vue'
import { Button } from '/@/components/ui/button'
import { Spinner } from '/@/components/ui/spinner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '/@/components/ui/alert-dialog'
import {
  closePrompt,
  closeWaiting,
  closing,
  settingsDirty,
  cancelClose,
  finishClose,
} from '/@/desktop/lifecycle'
import { desktopError } from '/@/desktop/status'

const { t } = useI18n()
</script>
