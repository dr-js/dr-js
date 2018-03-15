// faster, a != A
const compareString = (a, b) => (a < b) ? -1
  : (a > b) ? 1
    : 0

// slower, a == A
const compareStringLocale = (a, b) => a.localeCompare(b)

export {
  compareString,
  compareStringLocale
}
