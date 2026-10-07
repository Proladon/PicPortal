import { ref } from 'vue'
import { DesktopNotImplementedError, desktopErrorMessage } from './errors'

export const desktopError = ref('')

export function reportDesktopError(error: unknown): void {
  desktopError.value = desktopErrorMessage(error)
  if (!(error instanceof DesktopNotImplementedError)) console.error(error)
}
