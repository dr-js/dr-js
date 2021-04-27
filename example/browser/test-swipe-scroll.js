window.addContent(`
<style>
.drag-box { touch-action: none; position: fixed; top: 0; left: 0; width: 64px; height: 64px; box-shadow: inset 0 0 32px 4px #faa; }
</style>
`, `
<div id="SWIPE-TARGET" class="drag-box" style="transform: translate(300px, 300px); background: rgba(0,255,0,0.8); pointer-events: none;">SWIPE TARGET</div>
<div id="SWIPE" class="drag-box" style="transform: translate(300px, 300px);">SWIPE</div>
<div id="SCROLL" class="drag-box" style="transform: translate(300px, 400px);">SCROLL</div>
`, () => {
  const {
    document,
    qS,
    Dr: {
      Common: {
        Math: { easeOutCubic, easeInOutQuad },
        Geometry: { D2: { Vector } }
      },
      Browser: {
        Input: {
          PointerEvent: { applyEnhancedPointerEventListener },
          EnhancedEventProcessor: { createSwipeEnhancedEventProcessor }
        }
      }
    }
  } = window

  const limitWithElementBoundingClientRect = ({ x, y }, element) => {
    const { clientWidth, clientHeight } = document.documentElement
    const { width, height } = element.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(clientWidth - width, x)),
      y: Math.max(0, Math.min(clientHeight - height, y))
    }
  }

  const getTimeToDistanceFromVelocityAccelerate = (s, v, a) => {
    if (a === 0) return s / v
    // att + vt = s
    // att + vt + pow(v/2/sqrt(a), 2) = s + pow(v/2/sqrt(a), 2)
    // pow((sqrt(a)t + v/2/sqrt(a)), 2) = s + pow(v/2/sqrt(a), 2)
    // sqrt(a)t + v/2/sqrt(a) = sqrt(s + pow(v/2/sqrt(a), 2))
    // sqrt(a)t = sqrt(s + pow(v/2/sqrt(a), 2)) - v/2/sqrt(a)
    // t = sqrt(s + pow(v/2/sqrt(a), 2))/sqrt(a) - v/2/sqrt(a)/sqrt(a)
    // t = sqrt(s/a + pow(v/2/a, 2)) - v/2/a
    const temp = 0.5 * v / a
    return Math.sqrt(s / a + temp * temp) - temp
  }

  const bindSwipeElement = (element = document.createElement('div'), targetMarkElement) => {
    const { x, y } = element.getBoundingClientRect()
    let currentPoint = { x, y }
    const { onEnhancedEvent, onEvent } = createSwipeEnhancedEventProcessor({
      getPointStart: (eventState) => {
        eventState.event.preventDefault()
        return currentPoint
      },
      updatePoint: (origin) => {
        currentPoint = limitWithElementBoundingClientRect(origin, element)
        element.style.transform = `translate(${Math.round(currentPoint.x)}px,${Math.round(currentPoint.y)}px)`
      },
      getExitInfo: ({ exitVector, pointCurrent, pointStart }) => {
        const exitSpeed = Vector.getLength(exitVector)
        const pointExit = limitWithElementBoundingClientRect(
          Vector.getDist(pointCurrent, pointStart) + exitSpeed * 0.25 < 256
            ? pointStart
            : Vector.add(pointCurrent, Vector.scale(exitVector, 0.25)),
          element
        )
        const targetVector = Vector.sub(pointExit, pointCurrent)
        const targetDistance = Vector.getLength(targetVector)
        const exitDuration = targetDistance ? getTimeToDistanceFromVelocityAccelerate(targetDistance, exitSpeed, 5000)
          : 0
        targetMarkElement.style.transform = `translate(${Math.round(pointExit.x)}px,${Math.round(pointExit.y)}px)`
        return { pointExit, exitDuration }
      },
      normalizeVector: ({ x, y }) => Math.abs(x) >= Math.abs(y)
        ? { x, y: 0 }
        : { x: 0, y }, // can lock result direction
      timeFunction: easeInOutQuad
    })
    applyEnhancedPointerEventListener({ element, onEnhancedEvent, onEvent, isGlobal: true, isCancelOnOutOfBound: false })
  }

  const bindScrollElement = (element = document.createElement('div')) => {
    const { x, y } = element.getBoundingClientRect()
    let currentPoint = { x, y }
    const { onEnhancedEvent, onEvent } = createSwipeEnhancedEventProcessor({
      getPointStart: (eventState) => {
        eventState.event.preventDefault()
        return currentPoint
      },
      updatePoint: (origin) => {
        currentPoint = limitWithElementBoundingClientRect(origin, element)
        element.style.transform = `translate(${Math.round(currentPoint.x)}px,${Math.round(currentPoint.y)}px)`
      },
      getExitInfo: ({ exitVector, pointCurrent }) => {
        const exitDuration = Math.abs(Vector.getLength(exitVector) / -5000)
        const pointExit = Vector.add(pointCurrent, Vector.scale(exitVector, exitDuration * 0.5))
        return { pointExit, exitDuration }
      },
      timeFunction: easeOutCubic
    })
    applyEnhancedPointerEventListener({ element, onEnhancedEvent, onEvent, isGlobal: true, isCancelOnOutOfBound: false })
  }

  bindSwipeElement(qS('#SWIPE'), qS('#SWIPE-TARGET'))
  bindScrollElement(qS('#SCROLL'))
})
