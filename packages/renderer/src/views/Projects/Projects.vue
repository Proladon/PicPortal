<template>
  <main class="projects">
    <h1>Projects</h1>
    <n-scrollbar>
      <div class="project-list">
        <ProjectCard
          v-for="(project, index) in projectsList"
          :key="index"
          :project="project"
          @open="openProject"
          @refresh="refreshProjects"
        />
        <ProjectCard newBtnCard @newProject="showCreateProjectModal = true" />
      </div>
    </n-scrollbar>
    <section class="btn-container">
      <n-button ghost @click="importProject">開啟專案</n-button>
    </section>
  </main>

  <CreateProjectModal
    v-if="showCreateProjectModal"
    @close="showCreateProjectModal = false"
    @refresh="refreshProjects"
  />
  <EditProjectModal
    v-if="showImportProjectEditModal"
    importMode
    :project="importProjectData"
    @refresh="refreshProjects"
    @close="showImportProjectEditModal = false"
  />
</template>

<script lang="ts" setup>
import ProjectCard from './components/ProjectCard.vue'
import { NScrollbar, NButton } from 'naive-ui/es'
import { onMounted, ref } from '@vue/runtime-core'
import CreateProjectModal from './components/CreateProjectModal.vue'
import EditProjectModal from './components/EditProjectModal.vue'
import { importProjectDialog } from '/@/utils/browserDialog'
import { useElectron } from '/@/use/electron'
import { findIndex } from 'lodash-es'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { nanoid } from 'nanoid/async'
import { useNotification } from 'naive-ui'
import { useAppStore } from '/@/store/appStore'

// ANCHOR Use
const { fileSystem, userStore } = useElectron()
const store = useStore()
const router = useRouter()
const notify = useNotification()
const appStore = useAppStore()
// ANCHOR Data
const projectsList = ref([])
const showCreateProjectModal = ref(false)
const showImportProjectEditModal = ref(false)
const importProjectData = ref<any>(null)

// --- Methods ---

// => 開啟專案
// const openProject = async (projectPath: string) => {
//   // TODO 開啟專案
//   // 檢查專案檔是否存在
//   const [file, fileError] = await fileSystem.checkExist(projectPath)
//   if (fileError) return console.log(fileError)
//   // TODO 找不到檔案 彈出提示刪除窗
//   if (!file) {
//     const projects = await userStore.get('projects')
//     const index = findIndex(projects, projectPath)
//     projects.splice(index, 1)
//     await userStore.set('projects', projects)
//     await refreshProjects()
//   }

//   await store.dispatch('PROJECT_PATH', projectPath)
//   const [db, dbError] = await store.dispatch('CONNECT_DB')
//   if (dbError) return alert(dbError)
//   await store.dispatch('SYNC_DB', db)

//   router.push('/editor/viewer/grid-view')
// }

const openProject = async (project: any) => {
  console.log(project)
  const [file, fileError] = await fileSystem.checkExist(project.path)
  if (fileError) return notify.error({ content: fileError, duration: 3000 })
  if (!file) {
    return notify.error({
      content: 'Can not find project file',
      duration: 3000
    })
    // const projects = await userStore.get('projects')
    // const filterProjects = projects.filter((p: any) => p.id !== project.id)
    // await userStore.set('projects', filterProjects)
    // await refreshProjects()
  }
  appStore.SetOpenProject(project)
  // TODO Loading
  const [dbData, dbError] = await appStore.ConnectProjectDB()
  if (dbError) return notify.error({ content: dbError, duration: 3000 })
  await appStore.SyncDBData({ dbData })
  router.push({ name: 'GridView' })
}

const importProject = async () => {
  const open = await importProjectDialog()
  const canceled = open.canceled
  const filePath = open.filePaths[0]

  if (canceled) return
  importProjectData.value = {
    id: await nanoid(10),
    name: null,
    path: filePath,
    color: null
  }
  showImportProjectEditModal.value = true
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
.projects {
  @apply w-full h-full flex flex-col justify-between pb-10;
}
.project-list {
  @apply flex flex-wrap flex-1 p-10 gap-5 justify-center;
}

.btn-container {
  @apply flex justify-center gap-5 px-10;
}

.new-project-btn {
  @apply bg-teal-400 text-gray-800 px-5 py-2 rounded-sm;
}
</style>
