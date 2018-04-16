// returns [ from, from + 1, from + 2, ..., to -2, to - 1, to ]
const getSampleRange = (from, to) => ' '.repeat(to - from + 1).split('').map((v, i) => (i + from))

// returns [ 0, 1 / divide, 2 / divide, ..., (divide - 1) / divide, 1 ]
const getSampleRate = (divide) => getSampleRange(0, divide).map((v) => v / (divide))

export { getSampleRange, getSampleRate }
