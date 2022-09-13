<template>
  <div class="general-settings">
    <n-form>
      <n-form-item label="Portalpanel Position">
        <n-button-group>
          <n-button
            :type="portalPanelPosition === 'left' ? 'primary' : ''"
            @click="syncModel.portalPanelPosition = 'left'"
          >
            左邊
          </n-button>
          <n-button
            :type="portalPanelPosition === 'right' ? 'primary' : ''"
            @click="syncModel.portalPanelPosition = 'right'"
          >
            右邊
          </n-button>
        </n-button-group>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { NForm, NFormItem, NButtonGroup, NButton } from 'naive-ui'
import { computed } from 'vue'
import useLocale from '/@/use/locale'

const { translate } = useLocale()
const emit = defineEmits(['update:model'])
const props = defineProps({
  model: {
    type: Object,
    default: () => ({}),
  },
})

const portalPanelPosition = computed(() => syncModel.value.portalPanelPosition)

const syncModel = computed({
  get() {
    return props.model
  },
  set(value) {
    return emit('update:model', value)
  },
})
</script>

<style scoped lang="postcss"></style>
