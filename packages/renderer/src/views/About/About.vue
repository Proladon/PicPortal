<template>
  <n-scrollbar>
    <div class="about">
      <div class="left-pane">
        <!-- developer-info -->
        <section class="developer-info">
          <main class="card">
            <img class="avatar object-cover" :src="avatar" />

            <article class="flex flex-col">
              <h3 class="text-xl">Proladon</h3>
              <div>
                <a class="flex items-center" href="https://github.com/Proladon">
                  <n-icon size="20" class="mr-2"> <logo-github /></n-icon>
                  <span>Github</span>
                </a>
              </div>
            </article>
          </main>
        </section>

        <!-- version-info -->
        <n-alert :show-icon="false">
          <div class="mb-[10px]">
            <p>PicPortal {{ version }}</p>
          </div>

          <div>
            <p>Node: {{ platform.node }}</p>
            <p>Electron: {{ platform.electron }}</p>
            <p>Chorme: {{ platform.chrome }}</p>
          </div>
        </n-alert>

        <!-- tech-info -->
        <section class="logo-list flex-1">
          <img src="../../../assets/about/tools/vite.svg" alt="vite" />
          <img src="../../../assets/about/tools/vue.svg" alt="vue" />
          <img src="../../../assets/about/tools/typescript.svg" alt="ts" />
          <img src="../../../assets/about/tools/electron.png" alt="electron" />
        </section>
      </div>
      <div class="right-pane"></div>
    </div>
  </n-scrollbar>
</template>

<script lang="ts" setup>
import avatar from '/@/assets/Oreki.png'
import { LogoGithub } from '@vicons/ionicons5'
import { NIcon, NAlert, NScrollbar } from 'naive-ui/es'
import { ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import { useElectron } from '/@/use/electron'
const { appWindow } = useElectron()

const version = ref('')
const platform = ref({})

onMounted(async () => {
  version.value = await appWindow.getAppVersion()
  platform.value = window.electron.platform.versions
})
</script>

<style scoped lang="postcss">
.about {
  @apply w-full h-full p-[30px] py-[10px];
  @apply flex gap-[30px];
}

.developer-info {
  @apply flex flex-col gap-2 text-left;

  .card {
    @apply flex gap-5;
    .avatar {
      @apply w-[100px] h-[100px] rounded-xl !bg-cover !bg-center;
    }
  }
}
.logo-list {
  @apply flex gap-5;
  > img {
    @apply w-[40px];
  }
}

.left-pane,
.right-pane {
  @apply w-full h-full;
  @apply flex flex-col gap-[20px];
}
</style>
