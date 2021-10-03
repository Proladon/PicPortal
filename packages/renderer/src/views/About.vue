<template>
  <div class="about">
    About
    <section class="developer-info">
      <h2>Developer</h2>

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

    <section class="logo-list">
      <img src="../../assets/about/tools/vite.svg" alt="vite" />
      <img src="../../assets/about/tools/vue.svg" alt="vue" />
      <img src="../../assets/about/tools/typescript.svg" alt="ts" />
    </section>
  </div>
</template>

<script lang="ts" setup>
import avatar from '/@/assets/Oreki.png'
import { LogoGithub } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { defineComponent } from 'vue'
</script>

<style scoped lang="postcss">
.about {
  @apply w-full h-full p-10;
  @apply flex flex-col gap-5;
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
    @apply w-[30px];
  }
}
</style>
