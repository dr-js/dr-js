const { document, fetch } = window

const createElement = (tagName, attributeMap = {}) => Object.assign(document.createElement(tagName), attributeMap)

const loadText = async (uri) => (await fetch(uri)).text()
const loadImage = (uri) => new Promise((resolve, reject) => createElement('img', {
  src: uri,
  onerror: reject,
  onload: (event) => resolve(event.currentTarget)
}))

export {
  loadText,
  loadImage
}
