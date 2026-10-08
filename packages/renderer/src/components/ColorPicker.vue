<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        type="button"
        variant="outline"
        class="color-picker w-full justify-start gap-2 px-2 font-normal"
        :disabled="disabled"
      >
        <span
          class="size-4 shrink-0 rounded-[5px] border border-foreground/15"
          :class="{ 'bg-checker': !modelValue }"
          :style="modelValue ? { background: modelValue } : undefined"
        />
        <span
          class="truncate"
          :class="{ 'text-muted-foreground': !modelValue }"
        >
          {{ modelValue || placeholder }}
        </span>
        <ChevronDown class="ml-auto opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-60 gap-3" align="start">
      <div class="grid grid-cols-8 gap-1.5">
        <button
          v-for="color in presets"
          :key="color"
          type="button"
          class="relative size-6 rounded-md border border-foreground/10 transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          :style="{ background: color }"
          :title="color"
          @click="select(color)"
        >
          <Check
            v-if="sameColor(color, modelValue)"
            class="absolute inset-0 m-auto size-3.5"
            :style="{ color: readableTextColor(color) }"
          />
        </button>
      </div>
      <div class="flex items-center gap-2">
        <label
          class="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border"
          :style="{ background: hexValue }"
        >
          <input
            type="color"
            class="absolute inset-0 cursor-pointer opacity-0"
            :value="hexValue"
            @input="select(($event.target as HTMLInputElement).value)"
          />
        </label>
        <Input
          :model-value="modelValue"
          class="h-8 font-mono text-xs"
          placeholder="#000000"
          @update:model-value="select(String($event))"
        />
        <Button
          v-if="clearable"
          type="button"
          variant="ghost"
          size="icon-sm"
          :title="t('common.clear')"
          @click="select('')"
        >
          <Eraser />
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, ChevronDown, Eraser } from '@lucide/vue'
import { Button } from '/@/components/ui/button'
import { Input } from '/@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '/@/components/ui/popover'
import { readableTextColor } from '/@/utils/color'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '—' },
  clearable: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const open = ref(false)

const presets = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
  '#78716c',
  '#ffffff',
  '#18181b',
]

const hexValue = computed(() =>
  /^#[0-9a-f]{6}$/i.test(props.modelValue) ? props.modelValue : '#000000'
)

const sameColor = (a: string, b: string) =>
  a.toLowerCase() === (b || '').toLowerCase()

const select = (color: string) => {
  emit('update:modelValue', color.trim())
}
</script>

<style scoped>
.bg-checker {
  background-image: repeating-conic-gradient(
    var(--muted) 0 25%,
    transparent 0 50%
  );
  background-size: 8px 8px;
}
</style>
