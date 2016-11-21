export default function Toggle () {
  const toggle = (key, value) => {
    if (value === undefined) value = !toggle[ key ]
    toggle[ key ] = value
    return value
  }
  return toggle
}
