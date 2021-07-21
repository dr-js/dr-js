import { tryRequire } from 'source/env/tryRequire.js'
import { isBasicFunction } from 'source/common/check.js'

// About permission:
//   This provide a basic pattern to inject custom check code,
//     to conditionally deny/allow some operation.
//   The pattern try to behave like how I18N is done in code,
//     so an async check function is all there is,
//     the checkpoint will passing in the permission type & payload,
//     await and get a Boolean result.
//   For more complex permission check, more code can fit in side the `permissionFunc/File`,
//     or if really needed, just hard code the check point in place.

// const PERMISSION_PACK_SAMPLE = {
//   checkPermission: async (type, { store }) => true
// }

const DENY_ALL = () => false
const ALLOW_ALL = () => true

const configurePermission = async ({
  permissionType, // check below switch case for types
  permissionFunc, // configurePermissionFunc
  permissionFile, // full path to JS file exporting function with name `configurePermission`
  loggerExot
}) => {
  let configurePermissionFunc
  switch (permissionType) {
    // fast return
    case 'deny':
      loggerExot.add('use permission: deny-all')
      return { checkPermission: DENY_ALL }
    case 'allow':
      loggerExot.add('use permission: allow-all')
      return { checkPermission: ALLOW_ALL }

    // slow config
    case 'func':
      configurePermissionFunc = permissionFunc
      if (!isBasicFunction(configurePermissionFunc)) throw new Error('invalid permissionFunc')
      loggerExot.add('use permissionFunc')
      break
    case 'file' :
      configurePermissionFunc = (tryRequire(permissionFile) || { configurePermission: null }).configurePermission
      if (!isBasicFunction(configurePermissionFunc)) throw new Error(`failed to load permissionFile: ${permissionFile}`)
      loggerExot.add('use permissionFile')
      break

    default:
      throw new Error(`invalid permissionType: ${permissionType}`)
  }

  const permissionPack = await configurePermissionFunc({ loggerExot })
  if (!isBasicFunction(permissionPack.checkPermission)) throw new Error('expect permissionPack.checkPermission to be function')
  return permissionPack
}

export { configurePermission }
