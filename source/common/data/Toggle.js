const createToggle = () => {
  const data = new Map()
  const toggle = (key, value) => {
    if (value === undefined) value = !data.get(key)
    data.set(key, value)
    return value
  }
  toggle.get = data.get.bind(data)
  return toggle
}

export { createToggle }

// Usage:
// const toggle = createToggle()
// toggle('isActive', true)
// toggle.get('isActive') === true
// toggle('isActive')
// toggle.get('isActive') === false
// toggle('isActive')
// toggle.get('isActive') === true
// toggle('isActive', 'VALUE')
// toggle.get('isActive') === 'VALUE'
// toggle('isActive')
// toggle.get('isActive') === false
