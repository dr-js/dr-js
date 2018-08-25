window.addContent(`
<style>
.indicator { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(255,0,0,0.5); }
</style>
`, `
<div id="root" class="flex-column" style="overflow: auto; width: 100vw; min-height: 100vh; align-items: center; font-family: monospace;">
${`<button>AAA</button><hr /><p>BBB</p><hr />`.repeat(100)}
</div>
<div id="INDICATOR-MASK" class="indicator" style="display: none; pointer-events: none; box-shadow: inset 0 0 0 1px #000;"></div>
<div id="INDICATOR-RECT" class="indicator" style="width: 0; height: 0; background: rgba(0,0,255,0.4); box-shadow: inset 0 0 0 1px #00f;"></div>
<div id="INDICATOR-H" class="indicator" style="height: 1px;"></div>
<div id="INDICATOR-V" class="indicator" style="width: 1px;"></div>
`, () => {
  const {
    qS, log,
    Dr: {
      Common: {
        Math: { clamp, easeOutCubic, easeInOutQuad },
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

  const limitWithinClient = ({ x, y }) => {
    const { clientWidth, clientHeight } = document.documentElement
    return {
      x: Math.max(0, Math.min(clientWidth - 1, x)),
      y: Math.max(0, Math.min(clientHeight - 1, y))
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

  const isClientEdge = ({ x, y }, threshold = 24) => {
    const { clientWidth, clientHeight } = document.documentElement
    return x >= 0 && x <= threshold ? 'left'
      : x >= clientWidth - threshold && x <= clientWidth ? 'right'
        : y >= 0 && y <= threshold ? 'top'
          : y >= clientHeight - threshold && y <= clientHeight ? 'bottom'
            : ''
  }

  const oppositeDirectionMap = {
    left: 'right',
    right: 'left',
    top: 'bottom',
    bottom: 'top'
  }
  const unitVectorMap = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 }
  }
  const getEdgeMap = {
    left: (width, height, { x, y }) => ({ x: 0, y }),
    right: (width, height, { x, y }) => ({ x: width, y }),
    top: (width, height, { x, y }) => ({ x, y: 0 }),
    bottom: (width, height, { x, y }) => ({ x, y: height })
  }
  const getMainValueMap = {
    left: ({ x }) => x,
    right: ({ x }) => x,
    top: ({ y }) => y,
    bottom: ({ y }) => y
  }

  const RECT_SIZE = 280

  const bindEdgeSwipeElement = (element = document.createElement('div')) => {
    let startEdge

    const updateRectStyle = ({ x, y }) => {
      qS('#INDICATOR-H').style.transform = `translate(0,${Math.round(y)}px)`
      qS('#INDICATOR-V').style.transform = `translate(${Math.round(x)}px,0)`
      if (startEdge === 'left') {
        qS('#INDICATOR-RECT').style.width = `${Math.round(Math.min(x, RECT_SIZE))}px`
      } else if (startEdge === 'right') {
        qS('#INDICATOR-RECT').style.transform = `translate(${Math.round(Math.max(x, window.innerWidth - RECT_SIZE))}px,0)`
        qS('#INDICATOR-RECT').style.width = `${Math.round(Math.min(window.innerWidth - x, RECT_SIZE))}px`
      } else if (startEdge === 'top') {
        qS('#INDICATOR-RECT').style.height = `${Math.round(Math.min(y, RECT_SIZE))}px`
      } else if (startEdge === 'bottom') {
        qS('#INDICATOR-RECT').style.transform = `translate(0,${Math.round(Math.max(y, window.innerHeight - RECT_SIZE))}px)`
        qS('#INDICATOR-RECT').style.height = `${Math.round(Math.min(window.innerHeight - y, RECT_SIZE))}px`
      }
    }

    const { onEnhancedEvent, onEvent } = createSwipeEnhancedEventProcessor({
      getPointStart: (eventState) => {
        const pointStart = limitWithinClient(eventState.point)
        startEdge = isClientEdge(limitWithinClient(eventState.point))
        log('getPointStart', JSON.stringify({ pointStart, startEdge }))

        if (startEdge) {
          eventState.event.preventDefault()
          qS('#INDICATOR-MASK').style.display = ''
          qS('#INDICATOR-MASK').style.backgroundColor = `rgba(0,0,0,0)`
        }
        Object.assign(qS('#INDICATOR-RECT').style, startEdge === 'left' || startEdge === 'right' ? { width: '0', height: '100vh', transform: '' }
          : startEdge === 'top' || startEdge === 'bottom' ? { width: '100vw', height: '0', transform: '' }
            : { width: '0', height: '0', transform: '' }
        )
        return pointStart
      },
      updatePoint: (pointCurrent, eventState) => {
        if (!startEdge) return
        eventState && eventState.event.preventDefault()
        updateRectStyle(limitWithinClient(pointCurrent))

        const rate = Math.abs(
          getMainValueMap[ startEdge ](getEdgeMap[ startEdge ](window.innerWidth, window.innerHeight, pointCurrent)) -
          getMainValueMap[ startEdge ](pointCurrent)
        ) / RECT_SIZE
        log('rate', rate)

        qS('#INDICATOR-MASK').style.backgroundColor = `rgba(0,0,0,${0.4 * easeInOutQuad(clamp(rate, 0, 1))})`
      },
      getExitInfo: ({ exitVector, pointCurrent }) => {
        if (!startEdge) return { pointExit: pointCurrent, exitDuration: 0 }

        exitVector = Vector.project(exitVector, unitVectorMap[ startEdge ])
        const exitSpeed = Vector.getLength(exitVector)
        const pointStartEdge = getEdgeMap[ startEdge ](window.innerWidth, window.innerHeight, pointCurrent)

        const edgeDistance = Math.abs(getMainValueMap[ startEdge ](pointCurrent) - getMainValueMap[ startEdge ](pointStartEdge))
        if (edgeDistance + exitSpeed * 0.25 <= RECT_SIZE * 0.5) return { pointExit: pointStartEdge, exitDuration: getTimeToDistanceFromVelocityAccelerate(edgeDistance, exitSpeed, 5000) }

        const pointExit = Vector.add(pointStartEdge, Vector.scale(unitVectorMap[ oppositeDirectionMap[ startEdge ] ], RECT_SIZE))
        console.log({ exitSpeed, pointExit })
        return { pointExit, exitDuration: getTimeToDistanceFromVelocityAccelerate(Math.abs(RECT_SIZE - edgeDistance), exitSpeed, 1000) }
      },
      timeFunction: easeOutCubic
    })
    applyEnhancedPointerEventListener({
      element,
      onEnhancedEvent,
      onEvent: (name, event, calcState) => {
        if (name === 'START') {
          qS('#INDICATOR-MASK').style.display = 'none'
        }
        onEvent(name, event, calcState)
      },
      isGlobal: true,
      isCancelOnOutOfBound: false
    })
  }

  bindEdgeSwipeElement(document.body)
})
