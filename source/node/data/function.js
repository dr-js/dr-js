import { randomFill } from 'crypto'
import { promisify } from 'util'

const randomFillAsync = promisify(randomFill)

// in bytes
const getRandomBufferAsync = (size) => randomFillAsync(Buffer.allocUnsafe(size))

export { getRandomBufferAsync }
