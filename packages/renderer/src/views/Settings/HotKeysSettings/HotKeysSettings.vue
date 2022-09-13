<template>
  <div class="hotkeys-settings">
    <n-form label-placement="left">
      <n-form-item label="清除已啟用portals">
        <KeyBindInput />
        <KeyBindInput />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { NForm, NFormItem, NInput, NButton, NMenu } from 'naive-ui'
import KeyBindInput from './components/KeyBindInput.vue'
</script>

<style scoped lang="postcss"></style>
