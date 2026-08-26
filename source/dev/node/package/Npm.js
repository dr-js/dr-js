import { resolve } from 'node:path'
import { cpus } from 'node:os'
import { withTimeoutPromise, runAsyncByLane } from 'source/common/function.js'
import { clamp } from 'source/common/math/base.js'
import { isVersionSpecComplex, parseSemVer, compareSemVer } from 'source/common/module/SemVer.js'
import { toPackageInfo, collectDependency } from 'source/common/module/PackageJSON.js'
import { writeJSON, readJSON } from 'source/node/fs/File.js'
import { withTempDirectory } from 'source/node/fs/Directory.js'
import { runNpm } from 'source/node/module/Software/npm.js'
import { getProcessListAsync, toProcessTree, findProcessTreeInfo, killProcessTreeInfoAsync } from 'source/node/system/Process.js'

const REGEXP_ALIAS_VER_SPEC = /npm:([\w@/-]+)@([^@"\s]+)/

const _npmJSON = async (args = [], packageRoot) => {
  const { promise, subProcess, stdoutPromise } = runNpm([ '--no-update-notifier', '--json', ...args ], { cwd: packageRoot, quiet: true, describeError: false })
  const { code, signal } = await withTimeoutPromise(
    promise.catch((error) => error), // allow error (exit with 1 if there's listed package)
    42 * 1000 // 42sec timeout
  ).catch(async (error) => {
    const processTreeInfo = await findProcessTreeInfo({ pid: subProcess.pid, ppid: process.pid }, toProcessTree(await getProcessListAsync()))
    await killProcessTreeInfoAsync(processTreeInfo)
    throw error
  })
  __DEV__ && console.log(`code: ${code}, signal: ${signal}`)
  return JSON.parse(String(await stdoutPromise))
}

const outdatedJSON = async ({
  packageRoot, // run outdated in place
  isBuggyTag = false // mode for npm registry return wrong tags, like NexusRepoOSS may return any recent version as `latest`, will use `npm view` to list & pick each version
}) => {
  if (isBuggyTag) {
    const { dependencyMap } = collectDependency(toPackageInfo({ packageJSON: await readJSON(resolve(packageRoot, 'package.json')) }))
    const outdatedMap = {} // { [name-spec]: { latest: '0.0.0' } }
    await runAsyncByLane(clamp(cpus().length || 0, 2, 8), Object.entries(dependencyMap).map(([ name, versionSpec ]) => async () => {
      const realName = REGEXP_ALIAS_VER_SPEC.test(versionSpec) ? REGEXP_ALIAS_VER_SPEC.exec(versionSpec)[ 1 ] : name
      const resJson = await _npmJSON([ 'view', realName ], packageRoot)
      const { versions = [] } = Array.isArray(resJson) ? resJson.pop() : resJson // npm view --json now always returns an array # https://github.com/npm/cli/releases/tag/v12.0.0
      const biggestVersion = versions.filter((v) => !isVersionSpecComplex(v) && !parseSemVer(v).label).sort(compareSemVer).pop() // smaller first, pick biggest version
      outdatedMap[ name ] = { latest: biggestVersion }
    }))
    return outdatedMap
  }

  // { [name-spec]: { latest: '0.0.0' } }
  const outdatedMap = await _npmJSON([ 'outdated' ], packageRoot)
  return Object.fromEntries(
    Object.entries(outdatedMap)
      // NOTE: use original alias name for aliased package like: `"alias-name": "npm:src-name@ver-spec"`
      //   the `name-spec` will be like: `alias-name:src-name@ver-spec`
      .map(([ k, v ]) => [ k.includes(':') ? k.split(':')[ 0 ] : k, v ])
  )
}

const outdatedWithTempJSON = async ({
  packageJSON, // create temp packageRoot and run outdated
  pathTemp,
  isBuggyTag = false
}) => withTempDirectory(async (pathTemp) => {
  const { dependencyMap } = collectDependency(toPackageInfo({ packageJSON }))
  await writeJSON(resolve(pathTemp, 'package.json'), { // minimal data
    dependencies: dependencyMap // must put all in "dependencies" or npm will skip the check
  })
  return outdatedJSON({ packageRoot: pathTemp, isBuggyTag })
}, pathTemp)

export {
  REGEXP_ALIAS_VER_SPEC,
  outdatedJSON, outdatedWithTempJSON
}
