const DEFAULT_OPEN_COMMAND_LIST_MAP = {
  // [ process.platform ]: [ command, ...prefixArgList ]

  linux: [ 'xdg-open' ],

  // better than the both `start` (cmd builtin need nasty quoting) and `explorer.exe` (standalone but fail on `http://localhost?a=1#some://url?with=special&chars=:->`)
  // now the problem will be how to pass this to node on win32. check quoting problem: https://github.com/sindresorhus/open#double-quotes-on-windows
  // check:
  // - https://ss64.com/nt/rundll32.html
  // - https://superuser.com/questions/1456314/open-url-with-windows-explorer/1456333#1456333
  // - https://superuser.com/questions/36728/can-i-launch-urls-from-command-line-in-windows/36730#36730
  win32: [ 'rundll32.exe', 'url.dll,OpenURL' ],

  darwin: [ 'open' ],

  android: [ 'termux-open' ] // TODO: may have other options?
}

// open URL or File with System Default, no need `{ shell: true }` os no extra escaping needed
const getDefaultOpenCommandList = () => {
  const defaultOpenCommandList = DEFAULT_OPEN_COMMAND_LIST_MAP[ process.platform ]
  if (!defaultOpenCommandList) throw new Error(`unsupported platform: ${process.platform}`)
  return defaultOpenCommandList // [ command, ...prefixArgList ]
}

export { getDefaultOpenCommandList }

// ultimate URL test:
// require('node:child_process').spawnSync('rundll32.exe', [ 'url.dll,OpenURL', 'http://localhost?a=1#some://url?with=special&chars\'\":[]{}()!@#$%^&*-=_+<>,.?/\\' ])
// require('node:child_process').spawnSync('open', [ 'http://localhost?a=1#some://url?with=special&chars\'\":[]{}()!@#$%^&*-=_+<>,.?/\\' ])
// require('node:child_process').spawnSync('xdg-open', [ 'http://localhost?a=1#some://url?with=special&chars\'\":[]{}()!@#$%^&*-=_+<>,.?/\\' ])
// require('node:child_process').spawnSync('termux-open', [ 'http://localhost?a=1#some://url?with=special&chars\'\":[]{}()!@#$%^&*-=_+<>,.?/\\' ])
