<template>
  <Dialog :open="showModal" @update:open="updateModalShow">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ modalTitle }}</DialogTitle>
      </DialogHeader>
      <form class="grid gap-4" @submit.prevent="submit">
        <Field :data-invalid="invalid || undefined">
          <FieldLabel for="portal-group-name">
            {{ t('portalPane.portalGroupModal.name') }}
          </FieldLabel>
          <Input
            id="portal-group-name"
            v-model="formData.name"
            autocomplete="off"
            :aria-invalid="invalid || undefined"
            :placeholder="t('portalPane.portalGroupModal.placeholder.name')"
          />
        </Field>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="updateModalShow(false)"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button type="submit" class="modal-submit">
            {{ mode === 'edit' ? t('common.update') : t('common.create') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import { computed, reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { nanoid } from 'nanoid/async'
import { findIndex } from 'lodash-es'
import { Button } from '/@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '/@/components/ui/dialog'
import { Field, FieldLabel } from '/@/components/ui/field'
import { Input } from '/@/components/ui/input'
import { dataClone } from '/@/utils/data'
import { useAppStore } from '/@/store/appStore'
import { usePortalPaneStore } from '/@/store/portalPaneStore'
import { useModal } from '/@/use/modal'

const emit = defineEmits(['close'])
const props = defineProps({
  mode: String,
  group: {
    type: Object as PropType<PortalGroup>,
    default: () => ({ id: '', group: '', childs: [] }),
  },
})

const appStore = useAppStore()
const portalPaneStore = usePortalPaneStore()
const { t } = useI18n()
const { showModal, updateModalShow } = useModal(emit)
// --- Data ---
const invalid = ref(false)
const formData = reactive({
  name: '',
})

// --- Computed ---
const portalsData = computed(() => portalPaneStore.portals)
const modalTitle = computed(() => {
  const mode = props.mode
  if (mode === 'edit') return t('portalPane.portalGroupModal.title.edit')
  if (mode === 'create') return t('portalPane.portalGroupModal.title.create')
  return ''
})

// --- Methods ---
const newGroup = async (exist?: PortalGroup) => {
  return {
    group: formData.name,
    id: exist ? exist.id : await nanoid(10),
    childs: exist ? exist.childs : [],
  }
}
const updatePortalGroup = async (): Promise<void> => {
  const portalsRef = dataClone(portalsData.value)
  const group = await newGroup(props.group)

  const groupIndex = findIndex(portalsRef, { id: props.group.id })
  portalsRef[groupIndex] = group

  const [, saveError] = await appStore.SaveToDB({
    key: 'portals',
    data: portalsRef,
  })
  if (saveError) alert(saveError)

  await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
  updateModalShow(false)
}

const createPortalGroup = async (): Promise<void> => {
  const portalsRef = dataClone(portalsData.value)
  const group = await newGroup()
  portalsRef.push(group)

  const [, saveError] = await appStore.SaveToDB({
    key: 'portals',
    data: portalsRef,
  })
  if (saveError) alert(saveError)

  await appStore.SyncDBDataToState({ syncKeys: ['portals'] })
  updateModalShow(false)
}

const submit = async () => {
  invalid.value = !formData.name.trim()
  if (invalid.value) return
  if (props.mode === 'edit') await updatePortalGroup()
  else if (props.mode === 'create') await createPortalGroup()
}

// --- Mounted ---
onMounted((): void => {
  showModal.value = true
  if (props.mode !== 'edit') return
  formData.name = props.group.group
})
</script>
