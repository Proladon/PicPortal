<template>
  <main class="projects flex h-full flex-col">
    <header
      class="flex flex-wrap items-end justify-between gap-4 border-b px-8 pt-7 pb-5"
    >
      <div class="min-w-0">
        <h1 class="text-xl font-semibold tracking-tight">
          {{ t('projects.pageTitle') }}
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('projects.description') }}
          <span v-if="projectsList.length" class="tabular-nums">
            · {{ t('projects.count', { count: projectsList.length }) }}
          </span>
        </p>
      </div>
      <section class="btn-container flex flex-wrap items-center gap-2">
        <Button
          class="import-settings-btn"
          variant="ghost"
          :disabled="loading"
          @click="importSettings"
        >
          <Download />
          {{ t('projects.importElectron') }}
        </Button>
        <Button
          class="import-project-btn"
          variant="outline"
          :disabled="loading"
          @click="importProject"
        >
          <FolderOpen />
          {{ t('projects.openExisting') }}
        </Button>
        <Button
          class="new-project-btn"
          :disabled="loading"
          @click="showCreateProjectModal = true"
        >
          <Plus />
          {{ t('projects.newProject') }}
        </Button>
      </section>
    </header>

    <div class="relative min-h-0 flex-1">
      <div class="h-full overflow-y-auto">
        <div
          v-if="projectsList.length"
          class="project-list grid gap-4 p-8"
          style="grid-template-columns: repeat(auto-fill, minmax(230px, 1fr))"
        >
          <ProjectCard
            v-for="project in projectsList"
            :key="project.id"
            :project="project"
            @open="openProject"
            @refresh="refreshProjects"
          />
        </div>
        <Empty v-else-if="loaded" class="project-list h-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanban />
            </EmptyMedia>
            <EmptyTitle>{{ t('projects.empty.title') }}</EmptyTitle>
            <EmptyDescription>{{
              t('projects.empty.description')
            }}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent class="flex-row justify-center">
            <Button size="sm" @click="showCreateProjectModal = true">
              <Plus />
              {{ t('projects.newProject') }}
            </Button>
            <Button size="sm" variant="outline" @click="importProject">
              <FolderOpen />
              {{ t('projects.openExisting') }}
            </Button>
          </EmptyContent>
        </Empty>
      </div>
      <div
        v-if="loading"
        class="loading-overlay absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]"
      >
        <Spinner class="size-6 text-muted-foreground" />
      </div>
    </div>

    <footer class="px-8 pb-6">
      <DropZone
        projects
        class="h-14"
        :hint="t('projects.dropHint')"
        @paths="openDroppedProjects"
      />
    </footer>
  </main>

  <CreateProjectModal
    v-if="showCreateProjectModal"
    @close="showCreateProjectModal = false"
    @created="openCreatedProject"
  />
</template>

<script lang="ts" setup>
import ProjectCard from './components/ProjectCard.vue'
import DropZone from '/@/components/DropZone.vue'
import CreateProjectModal from './components/CreateProjectModal.vue'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Download, FolderKanban, FolderOpen, Plus } from '@lucide/vue'
import { Button } from '/@/components/ui/button'
import { Spinner } from '/@/components/ui/spinner'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '/@/components/ui/empty'
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
const { userStore } = desktop
const router = useRouter()
const appStore = useAppStore()
const { t } = useI18n()
const { changeLocale } = useLocale()
// ANCHOR Data
const loading = ref<boolean>(false)
const loaded = ref<boolean>(false)
const projectsList = ref<Project[]>([])
const showCreateProjectModal = ref(false)

// --- Methods ---

const openProject = async (project: any) => {
  if (loading.value || useViewerStore().wrap.wraping) return
  loading.value = true
  try {
    await openNativeProject(project.path, project)
  } catch (error) {
    reportDesktopError(error)
  } finally {
    loading.value = false
  }
}

const importProject = async () => {
  if (useViewerStore().wrap.wraping)
    return toast.warning(t('projects.notify.busy'))
  if (loading.value) return
  loading.value = true
  try {
    const open = await importProjectDialog()
    if (!open) return
    await openNativeProject(open[0])
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
    useTheme().applySettings(settings.general)
    useViewerStore().SET_PORTAL_PANEL_POSITION(
      settings.viewer.portalPanelPosition
    )
    toast.success(
      t('projects.notify.settingsImported', { count: result.addedProjects })
    )
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
    loaded.value = true
  }
}

// --- Mounted ---
onMounted(async () => {
  await refreshProjects()
})
</script>
