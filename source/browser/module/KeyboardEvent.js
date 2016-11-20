import Dr from 'Dr'

const TYPE = {
  keyup: 'keyup',
  keydown: 'keydown',
  keypress: 'keypress'
}

const IS_KEYBOARD_API_SUPPORTED = (() => { // detect KeyboardEvent https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
  try {
    const event = new KeyboardEvent('keypress', { key: 'Escape', code: 'Escape' })
    return Boolean(event.key === 'Escape' && event.code === 'Escape')
  } catch (error) {
    return false
  }
})()

const addListenerToElement = IS_KEYBOARD_API_SUPPORTED
  ? (element, callback) => {
    element.addEventListener('keydown', callback)
    element.addEventListener('keypress', callback)
    element.addEventListener('keyup', callback)
  }
  : getPolyfill()

export {
  TYPE,
  addListenerToElement,
  IS_KEYBOARD_API_SUPPORTED
}

export default {
  TYPE,
  addListenerToElement,
  IS_KEYBOARD_API_SUPPORTED
}

function getPolyfill () {
  const charCodeMap = {
    '8': 'Backspace',
    '9': 'Tab',
    '13': 'Enter',
    '16': 'ShiftLeft',
    '17': 'ControlLeft',
    '18': 'AltLeft',
    '19': 'Pause',
    '20': 'CapsLock',
    '27': 'Escape',
    '32': 'Space',
    '33': 'PageUp',
    '34': 'PageDown',
    '35': 'End',
    '36': 'Home',
    '37': 'ArrowLeft',
    '38': 'ArrowUp',
    '39': 'ArrowRight',
    '40': 'ArrowDown',
    '45': 'Insert',
    '46': 'Delete',
    '106': 'NumpadMultiply',
    '107': 'NumpadAdd',
    '109': 'NumpadSubtract',
    '110': 'NumpadDecimal',
    '111': 'NumpadDivide',
    '144': 'NumLock',
    '145': 'ScrollLock',
    '186': 'Semicolon',
    '187': 'Equal',
    '188': 'Comma',
    '189': 'Minus',
    '190': 'Period',
    '191': 'Slash',
    '192': 'Backquote',
    '219': 'BracketLeft',
    '220': 'Backslash',
    '221': 'BracketRight',
    '222': 'Quote'
  }

  const cc0 = '0'.charCodeAt(0)
  const ccA = 'A'.charCodeAt(0)
  const ccZ = 'Z'.charCodeAt(0)

  // Digit0 - Digit9
  Dr.loop(10, (i) => (charCodeMap[ cc0 + i ] = 'Digit' + i))

  // KeyA - KeyZ
  Dr.loop(ccZ - ccA + 1, (i) => (charCodeMap[ ccA + i ] = 'Key' + String.fromCharCode(ccA + i)))

  // Numpad0 - Numpad9
  Dr.loop(10, (i) => (charCodeMap[ 96 + i ] = 'Numpad' + i))

  // F1 - F12
  Dr.loop(12, (i) => (charCodeMap[ 112 + i ] = 'F' + (i + 1)))

  function parseEvent (event) {
    const { key, code, keyCode, which } = event
    return {
      ...event,
      code: code || charCodeMap[ keyCode || which ] || '',
      key: key || String.fromCharCode(keyCode || which) || ''
    }
  }

  // simple event wrapper, add all event in TYPE_REV
  return (element, callback) => {
    const polyfillCallback = (event) => callback(parseEvent(event))
    element.addEventListener('keydown', polyfillCallback)
    element.addEventListener('keypress', polyfillCallback)
    element.addEventListener('keyup', polyfillCallback)
  }
}

