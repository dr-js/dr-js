const { randomBytes } = require('crypto')
const { createStepper } = require('../../output-gitignore/library/common/time.js')

const logResult = (result) => {
  const size = result.length
  const avg = result.reduce((o, b) => o + b.readUInt32BE(0) / size, 0)
  const delta = avg - Math.pow(2, 31)
  console.log(' - size', size, '\tavg', avg, '\tdelta', delta)
}

const doTest = (loop) => {
  console.log('baseline', loop)
  {
    const stepper = createStepper()
    const result = []
    for (let i = 0; i < loop; i++) {
      const b = Buffer.allocUnsafe(4)
      b.writeUInt16BE((Math.random() * 0x10000) << 0, 0)
      b.writeUInt16BE((Math.random() * 0x10000) << 0, 0)
      result.push(b)
    }
    const timeDelta = stepper()
    console.log(' - done', timeDelta, timeDelta / loop)
    logResult(result)
  }

  console.log('test', loop)
  {
    const stepper = createStepper()
    const result = []
    for (let i = 0; i < loop; i++) {
      result.push(randomBytes(4))
    }
    const timeDelta = stepper()
    console.log(' - done', timeDelta, timeDelta / loop)
    logResult(result)
  }
}

doTest(100)
doTest(100)

doTest(10000)
doTest(10000)

doTest(1000000)
doTest(1000000)
