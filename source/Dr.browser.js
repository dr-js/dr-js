import Dr from './Dr'
import { Extend, Module } from './browser'

Object.assign(Dr, Extend)
Object.assign(Dr.Module, Module)

export default Dr
