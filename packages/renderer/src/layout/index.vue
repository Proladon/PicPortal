<template>
  <div class="layout">
    <TitleBar />
    <n-alert
      v-if="desktopError"
      class="desktop-status"
      type="warning"
      closable
      @close="desktopError = ''"
    >
      {{ desktopError }}
    </n-alert>

    <section class="main-wrapper">
      <Navbar />
      <router-view />
    </section>

    <StatusBar />
    <n-alert v-if="closeWaiting" type="info"
      >批次作業完成後將關閉。<n-button @click="cancelClose"
        >取消關閉</n-button
      ></n-alert
    >
    <n-modal :show="closePrompt" :mask-closable="false" :close-on-esc="false">
      <div class="p-5 bg-primary-bg">
        <p v-if="settingsDirty">設定尚未儲存。</p>
        <p v-else>尚有批次作業與衝突需要處理。</p>
        <div class="flex gap-3 mt-5 close-actions">
          <n-button @click="cancelClose">繼續使用</n-button>
          <n-button v-if="settingsDirty" @click="finishClose(true)"
            >儲存後關閉</n-button
          >
          <n-button @click="finishClose(false)">{{
            settingsDirty ? '放棄修改並關閉' : '作業完成後關閉'
          }}</n-button>
        </div>
      </div>
    </n-modal>
    <n-spin v-if="closing" class="absolute inset-0 bg-primary-bg opacity-80" />
  </div>
</template>

<script lang="ts" setup>
import TitleBar from './components/TitleBar.vue'
import Navbar from './components/NavBar.vue'
import StatusBar from './components/StatusBar.vue'
import { NAlert, NButton, NModal, NSpin } from 'naive-ui'
import {
  closePrompt,
  closeWaiting,
  closing,
  settingsDirty,
  cancelClose,
  finishClose,
} from '/@/desktop/lifecycle'
import { desktopError } from '/@/desktop/status'
</script>

<style lang="postcss" scoped>
.layout {
  @apply w-full h-full flex flex-col;
}
.main-wrapper {
  @apply flex flex-1 overflow-hidden;
}

.main-view {
  @apply overflow-y-auto;
}
</style>
