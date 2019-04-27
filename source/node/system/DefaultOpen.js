const DEFAULT_OPEN_MAP = {
  linux: 'xdg-open',
  win32: 'start',
  darwin: 'open',
  android: 'termux-open' // TODO: may have other options?
}

// open Path or File with System Default
const getDefaultOpen = () => {
  const defaultOpen = DEFAULT_OPEN_MAP[ process.platform ]
  if (!defaultOpen) throw new Error(`unsupported platform: ${process.platform}`)
  return defaultOpen
}

export { getDefaultOpen }
