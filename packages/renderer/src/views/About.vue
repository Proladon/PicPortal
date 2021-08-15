<template>
  <div class="about">
    About
    <section class="developer-info">
      <h2>Developer</h2>

      <main class="card">
        <div class="avatar" :style="`background: url('${avatar}')`"></div>
        <article class="flex flex-col">
          <h3>Proladon</h3>
          <div>
            <a href="https://github.com/Proladon">Github</a>
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

<script lang="ts">
import avatar from '../../assets/about/Oreki.png'
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'About',
  setup() {
    return { avatar }
  }
})
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
