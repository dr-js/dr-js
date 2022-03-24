// put common typedef here

declare const __DEV__: boolean

declare function describe(title: string, setupFunc: Function): void
declare function it(func: Function): void; declare function it(title: string, func: Function): void
declare function before(func: Function): void; declare function before(title: string, func: Function): void
declare function after(func: Function): void; declare function after(title: string, func: Function): void
declare function info(...args: any[]): void

type GetVoid = () => void
type GetNumber = () => number

type vJSON = null | boolean | number | string | [] | {} // value safe in JSON
