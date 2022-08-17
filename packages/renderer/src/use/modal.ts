import { ref } from 'vue'

export const useModal = (emit: CallableFunction) => {
  const showModal = ref<boolean>(false)

  const updateModalShow = (show: boolean) => {
    if (!show) {
      setTimeout(() => {
        emit('close')
      }, 300)
    }
    showModal.value = show
  }

  return {
    emit,
    showModal,
    updateModalShow,
  }
}
