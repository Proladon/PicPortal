<template>
  <main class="projects">
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
      <n-button ghost type="primary" @click="importProject">
        {{ translate('projects.import') }}
      </n-button>
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
import CreateProjectModal from './components/CreateProjectModal.vue'
import EditProjectModal from './components/EditProjectModal.vue'
import { NScrollbar, NButton, useNotification } from 'naive-ui/es'
import { onMounted, ref } from '@vue/runtime-core'
import { importProjectDialog } from '/@/utils/browserDialog'
import { useElectron } from '/@/use/electron'
import { useRouter } from 'vue-router'
import { nanoid } from 'nanoid/async'
import { useAppStore } from '/@/store/appStore'
import useLocale from '/@/use/locale'

// ANCHOR Use
const { fileSystem, userStore } = useElectron()
const router = useRouter()
const notify = useNotification()
const appStore = useAppStore()
const { translate } = useLocale()
// ANCHOR Data
const projectsList = ref([])
const showCreateProjectModal = ref(false)
const showImportProjectEditModal = ref(false)
const importProjectData = ref<any>(null)

// --- Methods ---

const openProject = async (project: any) => {
  const [file, fileError] = await fileSystem.checkExist(project.path)
  if (fileError) return notify.error({ content: fileError })
  if (!file) {
    return notify.error({
      content: translate('projects.notify.notFoundProject'),
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
  if (dbError) return notify.error({ content: dbError })
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
