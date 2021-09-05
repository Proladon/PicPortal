<template>
  <main class="projects">
    <div>
      <p v-for="(p, index) in projectsList" :key="index">{{ p }}</p>
    </div>
    <button @click="newProject">新增專案</button>
  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref } from '@vue/runtime-core'
import { useElectron } from '../use/electron'
const { browserDialog, fileSystem, userStore } = useElectron()

const projectsList = ref([])

// --- Methods ---
const newProject = async () => {
  const res = await browserDialog.save({
    title: '新增專案',
    filters: [
      {
        name: 'Datebase',
        extensions: ['db'],
      },
    ],
  })
  if (res.canceled) return

  console.log(res)
  const [, error] = await fileSystem.createFile(res.filePath)
  if (error) return console.log(error)

  const projects = await getProjects()
  if (!projects) return await userStore.set('projects', [res.filePath])
  projects.push(res.filePath)
  await userStore.set('projects', projects)
  projectsList.value = await getProjects()
}

const openProject = () => {
  // TODO 開啟專案
  // TODO 如果找不到檔案 刪除專案(清除位置)
}

const getProjects = async () => {
  return await userStore.get('projects')
}

// --- Mounted ---
onMounted(async () => {
  // TODO 列出所有DB專案
  const projects = await getProjects()
  console.log(projects)
  if (!projects) await userStore.set('projects', [])
  console.log(await getProjects())
  projectsList.value = projects
})
</script>

<style lang="postcss" scoped></style>
