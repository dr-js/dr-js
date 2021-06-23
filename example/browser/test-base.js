import { CLOCK_TO_SECOND, createStepper } from '../../output-gitignore/module/common/time.js'
import { createUpdateLoop } from '../../output-gitignore/module/common/module/UpdateLoop.js'

window.addContent(`
<style>
textarea { outline: none; resize: none; background: transparent; }
canvas { background-color: #ddd; margin: 0; padding: 0; border: 0; image-rendering: pixelated; }

.box, .flex-row, .flex-column { max-width: 100%; max-height: 100%; }
.box { overflow: auto; padding: 16px; }
.flex-row { display: flex; flex-flow: row wrap; }
.flex-column { display: flex; flex-flow: column wrap; }
</style>
`, `
<div style="position: fixed; top: 0; left: 0; pointer-events: none; font-size: 10px;">
  <pre id="FPS" style="color: #f66;">FPS</pre>
  <pre id="LOG" style="color: #bbb;">Log</pre>
</div>
`, () => {
  const createLogList = (maxLength = 20, logList = [], stepper = createStepper()) => (text) => {
    const deltaTime = stepper() * CLOCK_TO_SECOND
    logList.unshift(`[+${(deltaTime).toFixed(4)}s] ${text}`) // add to head of the array
    logList.length = maxLength
    return logList.join('<br />')
  }

  const getFpsStep = (maxLength = 20, fpsList = [], stepper = createStepper()) => () => {
    const deltaTime = stepper() * CLOCK_TO_SECOND
    fpsList.unshift(deltaTime === 0 ? 0 : 1 / deltaTime)
    fpsList.length = maxLength
    const [ sum, min, max ] = fpsList.reduce(([ sum, min, max ], v) => [ sum + v, Math.min(min, v), Math.max(max, v) ], [ 0, Infinity, -Infinity ])
    return `FPS: ${fpsList[ 0 ].toFixed(2)} | AVG: ${(sum / maxLength).toFixed(2)} [${min.toFixed(2)} - ${max.toFixed(2)}]`
  }

  const logList = createLogList()
  const stepFps = getFpsStep()

  const updateLoop = createUpdateLoop()
  updateLoop.start()
  updateLoop.setFunc('fps', () => window.qS('#FPS', stepFps()))

  const log = (...args) => {
    console.log(...args)
    window.qS('#LOG', logList(args.join(' ')))
  }

  log('init')
  window.addEventListener('error', (error) => log('[ERROR]', error.stack || error))

  window.updateLoop = updateLoop
  window.log = log
})
