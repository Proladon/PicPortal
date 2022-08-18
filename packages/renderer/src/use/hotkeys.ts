import hotkeys from 'hotkeys-js'

export const useHotkeys = () => {
  const registerHotkey = () => {
    console.log('registerHotkey')
    hotkeys('f3', function (event, handler) {
      event.preventDefault()
      alert('you pressed F3!')
    })
  }

  return {
    registerHotkey,
  }
}
