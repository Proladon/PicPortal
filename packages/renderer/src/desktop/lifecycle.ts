import { ref, watch } from 'vue'
import { useDesktop } from './index'
import { reportDesktopError } from './status'
import { useViewerStore } from '/@/store/viewerStore'
import { DBQueue } from '/@/store/appStore'

export const closePrompt = ref(false)
export const closeWaiting = ref(false)
export const closing = ref(false)
export const settingsDirty = ref(false)
let saveSettings: (() => Promise<void>) | undefined
let request = 0
let cancelWait: (() => void) | undefined

export function registerSettingsSave(save: () => Promise<void>): () => void {
  saveSettings = save
  return () => {
    if (saveSettings === save) {
      saveSettings = undefined
      settingsDirty.value = false
    }
  }
}
export function cancelClose(): void {
  request++
  cancelWait?.()
  cancelWait = undefined
  closePrompt.value = false
  closeWaiting.value = false
}
export async function finishClose(save: boolean): Promise<void> {
  const ticket = ++request
  closePrompt.value = false
  if (useViewerStore().wrap.wraping) {
    closeWaiting.value = true
    await new Promise<void>((resolve) => {
      const stop = watch(
        () => useViewerStore().wrap.wraping,
        (running) => {
          if (!running) {
            stop()
            resolve()
          }
        }
      )
      cancelWait = () => {
        stop()
        resolve()
      }
    })
  }
  if (ticket !== request) return
  cancelWait = undefined
  closing.value = true
  try {
    if (save && settingsDirty.value) {
      if (!saveSettings) throw new Error('設定頁已關閉，請重新儲存設定')
      await saveSettings()
    }
    await DBQueue.onIdle()
    await useDesktop().whenIdle()
    if (ticket === request) await useDesktop().appWindow.finishClose()
  } catch (error) {
    reportDesktopError(error)
    closePrompt.value = true
  } finally {
    closing.value = false
    closeWaiting.value = false
  }
}
export async function subscribeClose(): Promise<() => void> {
  if (useDesktop().runtime !== 'tauri')
    return () => {
      /* Electron handles native close. */
    }
  return useDesktop().onCloseRequested(() => {
    if (closing.value || closeWaiting.value) return
    if (settingsDirty.value || useViewerStore().wrap.wraping)
      closePrompt.value = true
    else void finishClose(false)
  })
}
