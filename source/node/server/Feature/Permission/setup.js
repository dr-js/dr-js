import { configurePermission } from 'source/node/module/Permission.js'

// TODO: NOTE: not fully thought out yet
//   basically permission supported feature should accept a permissionPack
//   and call `await permissionPack.checkPermission(TYPE, ...)` to get a Boolean and decide if abort or continue

const setup = async ({
  name = 'feature:permission',
  loggerExot, routePrefix = '',
  permissionType, permissionFunc, permissionFile
}) => {
  const permissionPack = await configurePermission({ permissionType, permissionFunc, permissionFile, loggerExot })

  return {
    permissionPack,
    name
  }
}

export { setup }
