import { addExitListenerSync, addExitListenerAsync, clearExitListener } from './ExitListener'

const setProcessExitListener = ({ listenerSync = EMPTY_FUNC, listenerAsync = EMPTY_FUNC }) => { // TODO: deprecate
  addExitListenerSync(listenerSync)
  addExitListenerAsync(listenerAsync)
  return clearExitListener
}
const EMPTY_FUNC = () => {}

export { setProcessExitListener } // TODO: deprecate
