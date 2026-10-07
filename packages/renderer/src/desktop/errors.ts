export class DesktopNotImplementedError extends Error {
  readonly code = 'NOT_IMPLEMENTED'

  constructor(operation: string) {
    super(`Tauri 尚未接上${operation}`)
    this.name = 'DesktopNotImplementedError'
  }
}

export function desktopErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const { code, message } = error as { code?: unknown; message?: unknown }
    if (code === 'FILE_EXIST') return 'FILE_EXIST'
    if (typeof message === 'string') {
      return typeof code === 'string' ? `${code}: ${message}` : message
    }
    if (typeof code === 'string') return code
  }
  return String(error)
}
