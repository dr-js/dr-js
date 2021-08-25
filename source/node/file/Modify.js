import {
  modifyCopy,
  modifyRename,
  modifyDelete,
  modifyDeleteForce
} from 'source/node/fs/Modify.js' // TODO: DEPRECATE: import from `node/fs/`

/** @deprecated */ const modifyCopyExport = modifyCopy // TODO: DEPRECATE
/** @deprecated */ const modifyRenameExport = modifyRename // TODO: DEPRECATE
/** @deprecated */ const modifyDeleteExport = modifyDelete // TODO: DEPRECATE
/** @deprecated */ const modifyDeleteForceExport = modifyDeleteForce // TODO: DEPRECATE

export {
  modifyCopyExport as modifyCopy, // TODO: DEPRECATE
  modifyRenameExport as modifyRename, // TODO: DEPRECATE
  modifyDeleteExport as modifyDelete, // TODO: DEPRECATE
  modifyDeleteForceExport as modifyDeleteForce // TODO: DEPRECATE
}
