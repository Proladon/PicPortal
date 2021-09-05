<template>
  <main class="projects">
    <button @click="newProject">新增專案</button>
  </main>
</template>

<script lang="ts" setup>
import { onMounted } from '@vue/runtime-core'
import { useElectron } from '../use/electron'
const { browserDialog } = useElectron()

// --- Methods ---
const newProject = async () => {
  const res = await browserDialog.save({
    title: '新增專案',
  })
  if (res.canceled) return

  console.log(res)
  // TODO 建立DB
  // TODO 紀錄DB位置
}

const openProject = () => {
  // TODO 開啟專案
}

// --- Mounted ---
onMounted(() => {
  // TODO 列出所有DB專案
})
</script>

<style lang="postcss" scoped></style>
