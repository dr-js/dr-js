const initModal = () => {
  const {
    document,
    cE, aCL,
    Dr: { Common: { Error: { catchAsync } } }
  } = window

  const MODAL_Z_INDEX = 0xffffff // not that big but should be enough
  const FULLSCREEN_STYLE = 'position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;'

  const renderModal = () => {
    const modalMaskDiv = cE('div', { style: `${FULLSCREEN_STYLE} background: var(--c-fill-l);` })
    const modalMainDiv = cE('div', { style: 'position: relative; overflow-y: auto; margin: 8px; padding: 4px; width: 760px; max-width: 92vw; min-width: 240px; background: var(--ct-bg-n); box-shadow: 0 0 2px 0 #888;' })
    const modalDiv = cE('div', { style: `${FULLSCREEN_STYLE} display: flex; flex-flow: column; align-items: center; justify-content: center; z-index: ${MODAL_Z_INDEX};` }, [ modalMaskDiv, modalMainDiv ])
    return { modalDiv, modalMaskDiv, modalMainDiv }
  }

  // NOTE: multiple modal will just overlap
  // NOTE: no timeout protection is added here
  const withModal = async (func) => {
    const { modalDiv, modalMaskDiv, modalMainDiv } = renderModal()
    document.body.appendChild(modalDiv)
    const { result, error } = await catchAsync(func, { modalDiv, modalMaskDiv, modalMainDiv })
    modalDiv.remove()
    if (error) { throw error } else return result
  }

  const COMMON_FLEX_STYLE = { display: 'flex', flexFlow: 'column' }
  const createFlexRow = (...args) => cE('div', { style: 'display: flex; flex-flow: row; align-items: center; justify-content: center;' }, args)
  const createMessage = (message) => cE('pre', { innerText: message, style: 'overflow: auto; max-height: 64vh; white-space: pre;' })

  const withAlertModal = async (message) => withModal(({ modalMainDiv }) => new Promise((resolve) => {
    Object.assign(modalMainDiv.style, COMMON_FLEX_STYLE)
    const confirmButton = cE('button', { innerText: 'Confirm', onclick: resolve })
    aCL(modalMainDiv, [
      createMessage(message),
      createFlexRow(confirmButton)
    ])
    setTimeout(() => confirmButton.focus(), 200)
  }))

  const withConfirmModal = async (
    message,
    textConfirm = 'Confirm',
    textCancel = 'Cancel'
  ) => withModal(({ modalMainDiv }) => new Promise((resolve) => {
    Object.assign(modalMainDiv.style, COMMON_FLEX_STYLE)
    const confirmButton = cE('button', { innerText: textConfirm, onclick: () => resolve(true) })
    aCL(modalMainDiv, [
      createMessage(message),
      createFlexRow(
        cE('button', { innerText: textCancel, onclick: () => resolve(false) }),
        confirmButton
      )
    ])
    setTimeout(() => confirmButton.focus(), 200)
  }))

  const withPromptModal = async (
    message,
    defaultValue = '',
    textConfirm = 'Confirm',
    textCancel = 'Cancel'
  ) => withModal(({ modalMainDiv }) => new Promise((resolve) => {
    Object.assign(modalMainDiv.style, COMMON_FLEX_STYLE)
    const promptInput = cE('input', { value: defaultValue })
    aCL(modalMainDiv, [
      createMessage(message),
      promptInput,
      createFlexRow(
        cE('button', { innerText: textCancel, onclick: () => resolve(null) }),
        cE('button', { innerText: textConfirm, onclick: () => resolve(promptInput.value) })
      )
    ])
    setTimeout(() => promptInput.focus(), 200)
  }))

  const withPromptExtModal = async (
    inputInfoList, // [ [ message, defaultValue = '' ] ]
    textConfirm = 'Confirm',
    textCancel = 'Cancel'
  ) => withModal(({ modalMainDiv }) => new Promise((resolve) => {
    Object.assign(modalMainDiv.style, COMMON_FLEX_STYLE)

    const inputElementList = inputInfoList.reduce((o, [ message, defaultValue = '' ]) => {
      o.push(createMessage(message), cE('input', { value: defaultValue }))
      return o
    }, [])

    aCL(modalMainDiv, [
      ...inputElementList,
      createFlexRow(
        cE('button', { innerText: textCancel, onclick: () => resolve(null) }),
        cE('button', { innerText: textConfirm, onclick: () => resolve(inputElementList.filter((v, index) => index % 2).map((inputElement) => inputElement.value)) })
      )
    ])
    setTimeout(() => inputElementList[ 1 ].focus(), 200)
  }))

  return {
    MODAL_Z_INDEX,
    renderModal,
    withModal,
    withAlertModal,
    withConfirmModal,
    withPromptModal, withPromptExtModal
  }
}

export { initModal }
