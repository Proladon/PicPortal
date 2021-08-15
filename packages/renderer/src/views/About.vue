<template>
  <div class="about">
    About
    <section>
      <div class="avatar" :style="`background: url('${avatar}')`"></div>
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
}

.avatar {
  @apply w-[150px] h-[150px] rounded-xl !bg-cover !bg-center;
}
.logo-list {
  @apply flex gap-5;
  > img {
    @apply w-[30px];
  }
}
</style>
