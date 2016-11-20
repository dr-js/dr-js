import Dr from 'Dr'

Dr.window = Dr.GLOBAL.window // normally window, always in fact
Dr.document = Dr.GLOBAL.document // normally document, always in fact
Dr.devicePixelRatio = Dr.window.devicePixelRatio || 1

export const getBody = (document = Dr.document) => (document.body || document.getElementsByTagName('body')[ 0 ])

// document event
const emitEvent = Dr.Event.emit.bind(Dr.Event)
Dr.document.addEventListener('paste', (event) => {
  const content = event.clipboardData ? event.clipboardData.getData('text/plain') // get content
    : Dr.window.clipboardData ? Dr.window.clipboardData.getData('Text')
    : null
  emitEvent('PASTE', event, content) // pass on
})

// window event
Dr.window.addEventListener('scroll', (event) => { emitEvent('WINDOW_SCROLL', event) })
Dr.window.addEventListener('resize', (event) => { emitEvent('WINDOW_RESIZE', event) })
Dr.window.addEventListener('orientationchange', (event) => {
  emitEvent('WINDOW_ROTATION', event)
  if (!event.defaultPrevented) emitEvent('WINDOW_RESIZE', event)
})

// TODO: still messy
Dr.window.addEventListener('load', function (event) {
  Dr.WINDOW_LOADED = true
  emitEvent('WINDOW_LOADED', event)
})
Dr.document.addEventListener('load', function (event) {
  Dr.WINDOW_LOADED = true
  emitEvent('WINDOW_LOADED', event)
})

export function afterWindowLoaded (callback) {
  if (Dr.WINDOW_LOADED) callback('WINDOW_LOADED')
  else Dr.Event.addEventListener('WINDOW_LOADED', callback)
}

// client related (the visible area, view port)
export function getElementAtClient (view, clientX, clientY) {
  const element = view.document.elementFromPoint(clientX, clientY) // view should be a window
  if (element && ~element.tagName.toUpperCase().search(/FRAME/)) { // deal with frames...
    // for (let i = 0; i < view.frames.length; i++) if (view.self !== view.frames[ i ]) return Dr.getElementAtClient(view.frames[ i ], clientX - element.clientX, clientY - element.clientY)
    return Dr.warn('[getElementAtClient] Element in another Frame')
  }
  return element
}

export const simulateClientClick = Dr.window.MouseEvent ? (type, element, view, clientX, clientY) => {
  element.dispatchEvent(new Dr.window.MouseEvent('click', { 'view': view, 'clientX': clientX, 'clientY': clientY, 'bubbles': true, 'cancelable': true }))
} : Dr.document.createEventObject ? (type, element, view, clientX, clientY) => { // For IE 8
  const event = view.document.createEventObject()
  event.clientX = clientX
  event.clientY = clientY
  element.fireEvent('on' + type, event)
} : (type, element, view, clientX, clientY) => {
  const event = view.document.createEvent('MouseEvents')
// event.initMouseEvent(type, canBubble, cancelable, view, detail, screenX, screenY, clientX, clientY, ctrlKey, altKey, shiftKey, metaKey, button, relatedTarget)
  event.initMouseEvent(type, true, true, view, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null)
  element.dispatchEvent(event)
}

export const createRequest = Dr.window.XMLHttpRequest ? ({ url, method, headers, body, credentials, stateCallback }) => {
  return new Promise((resolve, reject) => {
    const request = new Dr.window.XMLHttpRequest()
    request.addEventListener('readystatechange', () => {
      if (request.readyState !== 4) return stateCallback && stateCallback(request)
      const { status, statusText, response, responseText, responseXML } = request
      resolve({
        request,
        status,
        statusText,
        ok: (status >= 200 && status < 300),
        response: response || responseText || responseXML
      })
    })
    request.addEventListener('error', reject)
    request.open(method, url, true)
    if (headers) for (const key in headers) request.setRequestHeader(key, headers[ key ])
    if (~[ 'same-origin', 'include' ].indexOf(credentials)) request.withCredentials = true
    request.send(body || null)
  })
} : 'Unsupported'

export const fetch = Dr.window.fetch ? Dr.window.fetch : (url, config) => createRequest({ url, ...config }) // super simple simulate
  .then((result) => {
    result.text = () => Promise.resolve(result.response.toString())
    result.json = () => Promise.resolve(JSON.parse(result.response))
    return result
  })

export function loadText (src) {
  return fetch(src)
    .then((response) => response.text())
}

export function loadImage (src) {
  return new Promise((resolve, reject) => {
    const element = new Image()
    element.addEventListener('load', () => resolve(element))
    element.addEventListener('error', reject)
    element.src = src
  })
}

export function createDownloadLink (name, content) {
  const element = Dr.document.createElement('a')
  element.setAttribute('download', name)
  element.setAttribute('href', content)
  element.click()
}
export function createDownloadLocalText (name, text) {
  const element = Dr.document.createElement('a')
  element.setAttribute('download', name)
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`)
  element.click()
}
export function createOffscreenCanvas (width, height) {
  const element = Dr.document.createElement('canvas')
  element.width = width
  element.height = height
  return element
}
export function createStyle (cssText) {
  const element = Dr.document.createElement('style')
  element.type = 'text/css'
  element.innerHTML = cssText
  Dr.document.getElementsByTagName('head')[ 0 ].appendChild(element)
}

export const getViewportSize = Dr.window.innerHeight ? () => {
  const { innerWidth, innerHeight } = Dr.window
  return { width: innerWidth, height: innerHeight }
} : (Dr.document.documentElement && Dr.document.documentElement.clientHeight) ? () => {
  const { clientWidth, clientHeight } = Dr.document.documentElement
  return { width: clientWidth, height: clientHeight }
} : () => {
  const { clientWidth, clientHeight } = getBody()
  return { width: clientWidth, height: clientHeight }
}

export const getScrollSize = (Dr.window.innerHeight && Dr.window.scrollMaxY) ? () => {
  return { x: getBody().scrollWidth, y: Dr.window.innerHeight + Dr.window.scrollMaxY }
} : () => {
  const { scrollWidth, scrollHeight, offsetWidth, offsetHeight } = getBody()
  return (scrollHeight > offsetHeight)
    ? { x: scrollWidth, y: scrollHeight }
    : { x: offsetWidth, y: offsetHeight }
}

export function getPageSize () {
  const { x, y } = getScrollSize()
  const { width, height } = getViewportSize()
  return { width: Math.max(x, width), height: Math.max(y, height) }
}

export const getScrollOffset = (Dr.window.pageXOffset !== undefined) ? () => {
  return { x: Dr.window.pageXOffset, y: Dr.window.pageYOffset }
} : (Dr.document.compatMode === 'CSS1Compat') ? () => {
  return { x: Dr.window.documentElement.scrollLeft, y: Dr.window.documentElement.scrollTop }
} : () => {
  return { x: Dr.window.body.scrollLeft, y: Dr.window.body.scrollTop }
}

