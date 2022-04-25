<template>
  <main class="projects">
    <div class="project-list">
      <n-tooltip
        trigger="hover"
        v-for="(project, index) in projectsList"
        :key="index"
      >
        <template #trigger>
          <div class="project-card" @click="openProject(project)">
            <n-h3 prefix="bar">
              <n-text type="primary">
                <n-ellipsis>
                  {{ project.name }}
                </n-ellipsis>
              </n-text>
            </n-h3>
            <p class="project-path">{{ project }}</p>
          </div>
        </template>
        <p>{{ project }}</p>
      </n-tooltip>
    </div>
    <section class="btn-container">
      <button class="new-project-btn" @click="showCreateProjectModal = true">
        新增專案
      </button>
      <button class="new-project-btn" @click="importProject">開啟專案</button>
    </section>
  </main>

  <CreateProjectModal
    v-if="showCreateProjectModal"
    @close="showCreateProjectModal = false"
    @created="onCreatedProject"
  />
</template>

<script lang="ts" setup>
import { NTooltip, NH3, NText, NEllipsis } from 'naive-ui/es'
import { onMounted, ref } from '@vue/runtime-core'
import CreateProjectModal from './components/CreateProjectModal.vue'
import { saveProjectDialog, importProjectDialog } from '/@/utils/browserDialog'
import { useElectron } from '../../use/electron'
const { fileSystem, userStore } = useElectron()
import { findIndex, find } from 'lodash-es'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import projectDBModel from '../../model/projectDB'
import { getFileName } from '/@/utils/file'

const store = useStore()
const router = useRouter()
const projectsList = ref([])
const showCreateProjectModal = ref(false)

// --- Methods ---
const getProjectName = (project: string) => {
  return getFileName(project.path)
}

// => 創建DB檔
const createDB = async (filePath: string) => {
  const pathChunk = filePath.split('\\')
  const dbName: string = pathChunk[pathChunk.length - 1].split('.')[0]

  const [, createErr] = await fileSystem.createFile(filePath)
  if (createErr) return console.log(createErr)

  const newProjectDB: ProjectDB = projectDBModel(dbName)
  const [, writeErr] = await fileSystem.writeJson(filePath, newProjectDB)
  if (writeErr) return console.log(writeErr)
}

// => 新增專案
const onCreatedProject = async (newProject) => {
  // TODO 覆蓋專案?
  const projects = await getProjects()
  if (!projects) return await userStore.set('projects', [newProject])
  projects.push(newProject)
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
  const [db, dbError] = await store.dispatch('CONNECT_DB')
  if (dbError) return alert(dbError)
  console.log(db)
  await store.dispatch('SYNC_DB', db)

  router.push('/editor/viewer/grid-view')
}

const importProject = async () => {
  // await userStore.remove('projects')
  const open = await importProjectDialog()
  const canceled = open.canceled
  const filePath = open.filePaths[0]

  if (canceled) return
  const projects = await getProjects()
  const exist = find(projects, (project) => project === filePath)
  if (exist) return
  projects.push(filePath)
  await userStore.set('projects', projects)
  await refreshProjects()
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
  @apply flex flex-wrap p-10 gap-5;
}
.project-card {
  @apply w-[150px] h-[200px];
  @apply bg-gray-600 p-[10px] rounded-sm text-left cursor-pointer;

  .project-path {
    @apply break-all;
  }
}

.btn-container {
  @apply grid grid-cols-2 gap-5 px-10;
}

.new-project-btn {
  @apply bg-teal-400 text-gray-800 px-5 py-2 rounded-sm;
}
</style>
