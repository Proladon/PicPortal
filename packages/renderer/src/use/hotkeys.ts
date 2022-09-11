import hotkeys from 'hotkeys-js'

export const useHotkeys = () => {
  const registerHotkey = ({
    bind,
    handler,
  }: {
    bind: string
    handler: CallableFunction
  }) => {
    console.log('registerHotkey')
    hotkeys(bind, function (event, handler) {
      event.preventDefault()
      alert('you pressed F3!')
    })
  }

  return {
    registerHotkey,
  }
}
