<template>
  <main class="projects">
    <n-scrollbar>
      <n-spin :show="loading">
        <div class="project-list">
          <ProjectCard
            v-for="(project, index) in projectsList"
            :key="index"
            :project="project"
            @open="openProject"
            @refresh="refreshProjects"
          />
          <ProjectCard
            v-if="desktop.runtime === 'electron'"
            newBtnCard
            @newProject="showCreateProjectModal = true"
          />
        </div>
      </n-spin>
    </n-scrollbar>
    <DropZone
      v-if="desktop.runtime === 'tauri'"
      projects
      class="mx-10 h-12"
      @paths="openDroppedProjects"
    />
    <section class="btn-container">
      <n-button
        v-if="desktop.runtime === 'tauri'"
        :disabled="loading"
        @click="showCreateProjectModal = true"
        >新增專案</n-button
      >
      <n-button
        v-if="desktop.runtime === 'tauri'"
        :disabled="loading"
        @click="importSettings"
        >匯入 Electron 設定</n-button
      >
      <n-button
        secondary
        type="primary"
        :disabled="loading"
        @click="importProject"
      >
        {{
          desktop.runtime === 'tauri'
            ? '開啟既有專案 (.db)'
            : translate('projects.import')
        }}
      </n-button>
    </section>
  </main>

  <CreateProjectModal
    v-if="showCreateProjectModal"
    @close="showCreateProjectModal = false"
    @refresh="refreshProjects"
    @created="openCreatedProject"
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
import DropZone from '/@/components/DropZone.vue'
import CreateProjectModal from './components/CreateProjectModal.vue'
import EditProjectModal from './components/EditProjectModal.vue'
import { NScrollbar, NButton, useNotification, NSpin } from 'naive-ui'
import { onMounted, ref } from '@vue/runtime-core'
import { importProjectDialog } from '/@/utils/browserDialog'
import { useDesktop } from '/@/desktop'
import { reportDesktopError } from '/@/desktop/status'
import { useRouter } from 'vue-router'
import { nanoid } from 'nanoid/async'
import { useAppStore, DBQueue } from '/@/store/appStore'
import useLocale from '/@/use/locale'
import { getFileName } from '/@/utils/file'
import { useViewerStore } from '/@/store/viewerStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import { getSettings } from '/@/use/settings'
import { useTheme } from '/@/use/theme'

// ANCHOR Use
const desktop = useDesktop()
const { fileSystem, userStore } = desktop
const router = useRouter()
const notify = useNotification()
const appStore = useAppStore()
const { translate, changeLocale } = useLocale()
// ANCHOR Data
const loading = ref<boolean>(false)
const projectsList = ref<Project[]>([])
const showCreateProjectModal = ref(false)
const showImportProjectEditModal = ref(false)
const importProjectData = ref<any>(null)

// --- Methods ---

const openProject = async (project: any) => {
  if (desktop.runtime === 'tauri') {
    if (loading.value || useViewerStore().wrap.wraping) return
    loading.value = true
    try {
      await openNativeProject(project.path, project)
    } catch (error) {
      reportDesktopError(error)
    } finally {
      loading.value = false
    }
    return
  }
  const [file, fileError] = await fileSystem.checkExist(project.path)
  if (fileError) return notify.error({ content: fileError })
  if (!file) {
    return notify.error({
      content: translate('projects.notify.notFoundProject'),
      duration: 3000,
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
  if (useViewerStore().wrap.wraping)
    return notify.warning({ content: '請先完成批次作業與衝突處理' })
  if (loading.value) return
  loading.value = true
  try {
    const open = await importProjectDialog()
    if (!open) return
    const filePath = open[0]
    if (desktop.runtime === 'tauri') {
      await openNativeProject(filePath)
      return
    }
    importProjectData.value = {
      id: await nanoid(10),
      name: null,
      path: filePath,
      color: null,
    }
    showImportProjectEditModal.value = true
  } catch (error) {
    reportDesktopError(error)
  } finally {
    loading.value = false
  }
}

// => 取得專案列表
const openNativeProject = async (filePath: string, metadata?: Project) => {
  await DBQueue.onIdle()
  const [dbData, error] = await desktop.database.connect(filePath)
  if (error || !dbData) throw new Error(error || '無法開啟專案')
  const [source, sourceError] = await desktop.database.getSourceFolder()
  if (sourceError) throw new Error(sourceError)
  const projects = (await userStore.get('projects')) || []
  const existing = projects.find(
    (project) =>
      project.path.replace(/\\/g, '/').toLowerCase() ===
      filePath.replace(/\\/g, '/').toLowerCase()
  )
  const project = metadata ||
    existing || {
      id: await nanoid(10),
      name: getFileName(filePath),
      path: filePath,
      color: '',
    }
  if (!existing) {
    projects.push(project)
    await userStore.set('projects', projects)
  }
  appStore.SetOpenProject(project)
  await appStore.SyncDBData({ dbData })
  appStore.sourceFolder = source
  const viewerStore = useViewerStore()
  viewerStore.folderFiles = []
  viewerStore.filter = { onlyDockings: false, portals: [], fileTypes: [] }
  usePortalPaneStore().ResetActivePortal()
  await router.push({ name: 'GridView' })
}
const openCreatedProject = async (project: Project) => {
  try {
    await openNativeProject(project.path, project)
    showCreateProjectModal.value = false
  } catch (error) {
    reportDesktopError(error)
  }
}
const openDroppedProjects = async (paths: string[]) => {
  if (loading.value || useViewerStore().wrap.wraping) return
  loading.value = true
  try {
    for (const path of paths) await openNativeProject(path)
  } catch (error) {
    reportDesktopError(error)
  } finally {
    loading.value = false
  }
}
const importSettings = async () => {
  loading.value = true
  try {
    const result = await desktop.importLegacySettings()
    if (!result) return
    const settings = await getSettings()
    changeLocale(settings.general.locale)
    await useTheme().setTheme(settings.general.theme)
    useViewerStore().SET_PORTAL_PANEL_POSITION(
      settings.viewer.portalPanelPosition
    )
    notify.success({
      content: `設定匯入完成，新增 ${result.addedProjects} 個專案；已存在的設定已保留`,
    })
    await refreshProjects()
  } catch (error) {
    reportDesktopError(error)
  } finally {
    loading.value = false
  }
}

const getProjects = async () => {
  return await userStore.get('projects')
}

// => 重新整理專案列表
const refreshProjects = async () => {
  loading.value = true
  try {
    const projects = await getProjects()
    if (!projects) await userStore.set('projects', [])
    projectsList.value = projects || []
  } catch (error) {
    reportDesktopError(error)
  } finally {
    loading.value = false
  }
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
  @apply flex justify-center gap-5 px-10 pt-[20px];
}

.new-project-btn {
  @apply bg-teal-400 text-gray-800 px-5 py-2 rounded-sm;
}
</style>
