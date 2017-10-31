const getTargetPosition = ({ currentTarget, clientX, clientY }) => {
  const { left, top } = currentTarget.getBoundingClientRect()
  return { x: clientX - left, y: clientY - top }
}

const applyPointerEventDragListener = ({ element, updateDragState, endDragState }) => {
  let from = null
  const setDragFrom = (event) => {
    from = getTargetPosition(event)
    updateDragState({ from, to: null }, event)
    addExtraListener()
  }
  const setDragTo = (event) => {
    updateDragState({ from, to: getTargetPosition(event) }, event)
  }
  const endDrag = (event) => {
    endDragState({ from, to: getTargetPosition(event) }, event)
    removeExtraListener()
  }
  const resetDragState = (event) => {
    from = null
    updateDragState({ from, to: null }, event)
    removeExtraListener()
  }
  const addExtraListener = () => {
    element.addEventListener('pointermove', setDragTo)
    element.addEventListener('pointerup', endDrag)
    element.addEventListener('pointercancel', resetDragState)
    element.addEventListener('pointerout', resetDragState)
  }
  const removeExtraListener = () => {
    element.removeEventListener('pointermove', setDragTo)
    element.removeEventListener('pointerup', endDrag)
    element.removeEventListener('pointercancel', resetDragState)
    element.removeEventListener('pointerout', resetDragState)
  }
  element.addEventListener('pointerdown', setDragFrom)
  return () => {
    element.removeEventListener('pointerdown', setDragFrom)
    removeExtraListener()
  }
}

export { applyPointerEventDragListener }
