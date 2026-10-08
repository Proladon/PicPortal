<template>
  <div class="about h-full overflow-y-auto">
    <div class="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-8">
      <section class="flex items-center gap-4">
        <div
          class="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md"
        >
          <Aperture class="size-8" />
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold tracking-tight">
            PicPortal {{ version }}
          </h1>
          <p class="text-sm text-muted-foreground">{{ t('about.tagline') }}</p>
        </div>
        <Badge variant="outline" class="ml-auto">Tauri</Badge>
      </section>

      <div class="grid gap-4 md:grid-cols-2">
        <Card class="developer-info">
          <CardHeader>
            <CardTitle>{{ t('about.developer') }}</CardTitle>
          </CardHeader>
          <CardContent class="flex items-center gap-4">
            <img
              class="avatar size-16 rounded-xl object-cover ring-1 ring-foreground/10"
              :src="avatar"
              alt=""
            />
            <div class="flex flex-col items-start gap-2">
              <p class="text-base font-semibold">Proladon</p>
              <Button
                size="sm"
                variant="outline"
                @click="appWindow.openExternal('https://github.com/Proladon')"
              >
                <GithubIcon />
                GitHub
                <ExternalLink class="opacity-60" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{{ t('about.system') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt class="text-muted-foreground">{{ t('about.platform') }}</dt>
              <dd class="font-mono text-xs leading-5">
                {{ desktopPlatform.os }}
              </dd>
              <template v-for="(value, name) in platform" :key="name">
                <dt class="text-muted-foreground">{{ name }}</dt>
                <dd class="font-mono text-xs leading-5 break-all">
                  {{ value }}
                </dd>
              </template>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{{ t('about.builtWith') }}</CardTitle>
        </CardHeader>
        <CardContent class="logo-list flex flex-wrap items-center gap-6">
          <img
            class="h-8"
            src="../../../assets/about/tools/vite.svg"
            alt="vite"
          />
          <img
            class="h-8"
            src="../../../assets/about/tools/vue.svg"
            alt="vue"
          />
          <img
            class="h-8"
            src="../../../assets/about/tools/typescript.svg"
            alt="ts"
          />
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import avatar from '/@/assets/Oreki.png'
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Aperture, ExternalLink } from '@lucide/vue'
import GithubIcon from '/@/components/icons/GithubIcon.vue'
import { Badge } from '/@/components/ui/badge'
import { Button } from '/@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '/@/components/ui/card'
import { useDesktop } from '/@/desktop'
const { appWindow, platform: desktopPlatform } = useDesktop()

const { t } = useI18n()
const version = ref('')
const platform = desktopPlatform.versions

onMounted(async () => {
  version.value = await appWindow.getAppVersion()
})
</script>
