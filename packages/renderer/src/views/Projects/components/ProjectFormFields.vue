<template>
  <FieldGroup class="gap-4">
    <Field :data-invalid="!!errors.name || undefined">
      <FieldLabel for="project-name">{{
        t('projects.createProject.fields.name')
      }}</FieldLabel>
      <Input
        id="project-name"
        v-model="name"
        autocomplete="off"
        :aria-invalid="!!errors.name || undefined"
        :placeholder="t('projects.createProject.placeholder.projectName')"
      />
      <FieldError v-if="errors.name">{{ errors.name }}</FieldError>
    </Field>
    <Field :data-invalid="!!errors.path || undefined">
      <FieldLabel for="project-path">{{
        t('projects.createProject.fields.path')
      }}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="project-path"
          v-model="path"
          class="font-mono text-xs"
          :disabled="pathDisabled"
          :readonly="pathReadonly"
          :aria-invalid="!!errors.path || undefined"
          :placeholder="t('projects.createProject.placeholder.projectPath')"
        />
        <InputGroupAddon v-if="browsable" align="inline-end">
          <InputGroupButton
            class="path-browse"
            size="icon-xs"
            :aria-label="t('common.browse')"
            :title="t('common.browse')"
            @click="$emit('browse')"
          >
            <FolderOpen />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldError v-if="errors.path">{{ errors.path }}</FieldError>
    </Field>
    <Field>
      <FieldLabel>{{ t('projects.createProject.fields.color') }}</FieldLabel>
      <ColorPicker v-model="color" />
    </Field>
  </FieldGroup>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { FolderOpen } from '@lucide/vue'
import ColorPicker from '/@/components/ColorPicker.vue'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '/@/components/ui/field'
import { Input } from '/@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '/@/components/ui/input-group'

const name = defineModel<string>('name', { default: '' })
const path = defineModel<string>('path', { default: '' })
const color = defineModel<string>('color', { default: '' })

defineProps({
  errors: {
    type: Object as PropType<{ name?: string; path?: string }>,
    default: () => ({}),
  },
  browsable: { type: Boolean, default: true },
  pathDisabled: { type: Boolean, default: false },
  pathReadonly: { type: Boolean, default: false },
})
defineEmits(['browse'])

const { t } = useI18n()
</script>
