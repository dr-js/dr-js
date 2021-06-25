const initLoadingMask = () => {
  const {
    document,
    qS, cE,
    Dr: { Common: { Error: { catchAsync }, Function: { lossyAsync } } }
  } = window

  const MASK_Z_INDEX = 0xffffff // not that big but should be enough

  const initialLoadingMaskState = { isLoading: false }

  const wrapLossyLoading = (loadingMaskStore, func) => lossyAsync(async (...args) => {
    if (loadingMaskStore.getState().isLoading) return
    loadingMaskStore.setState({ isLoading: true })
    await catchAsync(func, ...args)
    loadingMaskStore.setState({ isLoading: false })
  }).trigger

  const renderLoadingMask = (loadingMaskStore) => {
    const { isLoading } = loadingMaskStore.getState()
    const loadingMaskDiv = qS('#loading-mask')
    if (!isLoading) return loadingMaskDiv && loadingMaskDiv.remove()
    if (loadingMaskDiv) return
    document.body.appendChild(cE('div', {
      id: 'loading-mask',
      style: `position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; background: var(--c-fill-d); opacity: 0; z-index: ${MASK_Z_INDEX}; transition: opacity 1s ease;`
    }))
    setTimeout(() => {
      if (qS('#loading-mask')) qS('#loading-mask').style.opacity = '0.5'
    }, 200)
  }

  return {
    MASK_Z_INDEX,
    initialLoadingMaskState,
    wrapLossyLoading,
    renderLoadingMask
  }
}

export { initLoadingMask }
