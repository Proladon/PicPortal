<template>
  <main class="projects">
    <div class="project-list">
      <p @click="test">15156353</p>
      <div
        class="project"
        v-for="(p, index) in projectsList"
        :key="index"
        @click="openProject(p)"
      >
        <p>{{ p }}</p>
      </div>
    </div>
    <button class="new-project-btn" @click="newProject">新增專案</button>
  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref } from '@vue/runtime-core'
import { saveProjectDialog } from '/@/utils/browserDialog'
import { useElectron } from '../use/electron'
const { fileSystem, userStore, database } = useElectron()
import { findIndex } from 'lodash'
import { Low, JSONFile } from 'lowdb'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()
const projectsList = ref([])

// --- Methods ---

// => 創建DB檔
const createDB = async (filePath: string) => {
  const [, createErr] = await fileSystem.createFile(filePath)
  if (createErr) return console.log(createErr)

  const [, writeErr] = await fileSystem.writeJson(filePath, {})
  if (writeErr) return console.log(writeErr)
}

// => 新增專案
const newProject = async () => {
  const save = await saveProjectDialog()
  if (save.canceled) return
  // TODO 覆蓋專案?

  // const [, error] = await fileSystem.createFile(save.filePath)
  // if (error) return console.log(error)
  await createDB(save.filePath)

  const projects = await getProjects()
  if (!projects) return await userStore.set('projects', [save.filePath])
  projects.push(save.filePath)
  await userStore.set('projects', projects)
  await refreshProjects()
}

// => 開啟專案
const openProject = async (projectPath: string) => {
  // TODO 開啟專案
  // 檢查專案檔是否存在
  const [file, fileError] = await fileSystem.checkExist(projectPath)
  if (fileError) return console.log(fileError)
  // TODO 找不到檔案 彈出提示刪除窗
  if (!file) {
    const projects = await userStore.get('projects')
    const index = findIndex(projects, projectPath)
    projects.splice(index, 1)
    await userStore.set('projects', projects)
    await refreshProjects()
  }

  await store.dispatch('PROJECT_PATH', projectPath)
  const [dbRes, dbError] = await store.dispatch('CONNECT_DB')
  if (dbError) return alert(dbError)
  console.log(dbRes)

  router.push('/home')
}

// => 取得專案列表
const getProjects = async () => {
  return await userStore.get('projects')
}

// => 重新整理專案列表
const refreshProjects = async () => {
  const projects = await getProjects()
  if (!projects) await userStore.set('projects', [])
  projectsList.value = projects
}

// --- Mounted ---
onMounted(async () => {
  await refreshProjects()
})
</script>

<style lang="postcss" scoped>
.project-list {
  @apply flex p-10 gap-5;
}
.project {
  @apply bg-gray-600 p-2 rounded-sm;
  @apply cursor-pointer;
}

.new-project-btn {
  @apply bg-teal-400 text-gray-800 px-5 py-2 rounded-sm;
}
</style>
