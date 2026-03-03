import { relative } from 'node:path'

import { padTable } from 'source/common/format.js'
import { parseSemVer, isVersionSpecComplex } from 'source/common/module/SemVer.js'
import { loadPackageCombo, writePackageJSON } from 'source/node/module/PackageJSON.js'

import { REGEXP_ALIAS_VER_SPEC, outdatedJSON, outdatedWithTempJSON } from 'source/dev/node/package/Npm.js'

const sortResult = ({ dependencyInfoMap, outdatedMap, pathInput }) => {
  const sameTable = []
  const complexTable = []
  const outdatedTable = []

  for (const [ name, { latest: versionLatest } ] of Object.entries(outdatedMap)) {
    const { versionSpec, packageInfo: { packageJSONPath } } = dependencyInfoMap[ name ]
    const rowList = [ name, versionSpec, versionLatest, relative(pathInput, packageJSONPath) || '-' ] // must match PAD_FUNC_LIST
    if ((isVersionSpecComplex(versionSpec) && !REGEXP_ALIAS_VER_SPEC.test(versionSpec)) || parseSemVer(versionLatest).label) complexTable.push(rowList) // hard to parse
    else if (versionSpec.endsWith(versionLatest)) sameTable.push(rowList)
    else outdatedTable.push(rowList)
  }

  return { sameTable, complexTable, outdatedTable }
}

const logResult = ({ sameTable, complexTable, outdatedTable, log = console.log }) => {
  const total = sameTable.length + complexTable.length + outdatedTable.length
  __DEV__ && console.log(`Total: ${total} | Same: ${sameTable.length} | Complex: ${complexTable.length} | Outdated: ${outdatedTable.length}`)

  const outputList = []
  const sortPushTable = (table, title) => {
    table.sort(([ nameA, , , sourceA ], [ nameB, , , sourceB ]) => (sourceA !== sourceB) ? sourceA.localeCompare(sourceB) : nameA.localeCompare(nameB))
    table.length && outputList.push(`${title} [${table.length}/${total}]:`, padTable({ table, cellPad: ' | ' }))
  }
  sortPushTable(sameTable, 'SAME')
  sortPushTable(complexTable, 'COMPLEX')
  sortPushTable(outdatedTable, 'OUTDATED')

  log(outputList.join('\n'))
}

const writeBack = async ({ dependencyInfoMap, outdatedTable, pathInput, log = console.log }) => {
  for (const [ name, versionSpec, versionWanted ] of outdatedTable) {
    const { packageInfo: { packageJSON, packageJSONPath } } = dependencyInfoMap[ name ]
    const versionSpecStub = versionSpec.split('@')
    versionSpecStub.push(versionSpecStub.pop().split(/\d/)[ 0 ])
    const versionSpecNext = [ versionSpecStub.join('@'), versionWanted ].join('') // keep prefix like "^" & "~" and support aliased package version like: `"npm:src-name@ver-spec"`
    const tryUpdate = (key) => {
      if (!packageJSON[ key ] || packageJSON[ key ][ name ] !== versionSpec) return
      log(`[writeBack] update ${key}/${name} from "${versionSpec}" to "${versionSpecNext}" in: '${relative(pathInput, packageJSONPath)}'`)
      packageJSON[ key ][ name ] = versionSpecNext
    }
    tryUpdate('dependencies')
    tryUpdate('devDependencies')
    tryUpdate('peerDependencies')
    tryUpdate('optionalDependencies')
    await writePackageJSON(packageJSONPath, packageJSON)
  }
}

const doCheckOutdated = async ({
  pathInput,
  pathTemp,
  isWriteBack = false,
  isBuggyTag = false,
  log = console.log
}) => {
  log(`[checkOutdated] checking '${pathInput}'`)
  const { packageInfoList, dependencyMap, dependencyInfoMap, duplicateInfoList } = await loadPackageCombo(pathInput)
  log(`[checkOutdated] get ${packageInfoList.length} package`)
  for (const { name, versionSpec, packageInfo: { packageJSONPath }, existPackageInfo } of duplicateInfoList) {
    log(`[WARN] dropped duplicate package: ${name} at ${relative(pathInput, packageJSONPath)} with version: ${versionSpec}, checking: ${existPackageInfo.versionSpec}`)
  }
  const outdatedMap = (!pathTemp && packageInfoList.length === 1)
    ? await outdatedJSON({ packageRoot: packageInfoList[ 0 ].packageRootPath, isBuggyTag }) // check in-place
    : await outdatedWithTempJSON({ // create temp path, do not work for private repo or altered ".npmrc"
      packageJSON: { dependencies: dependencyMap },
      pathTemp: (pathTemp && pathTemp !== 'AUTO') ? pathTemp : undefined,
      isBuggyTag
    })
  const { sameTable, complexTable, outdatedTable } = sortResult({ dependencyInfoMap, outdatedMap, pathInput })
  logResult({ sameTable, complexTable, outdatedTable, log })
  if (isWriteBack) await writeBack({ dependencyInfoMap, outdatedTable, pathInput, log })
  else if (outdatedTable.length) throw new Error(`[checkOutdated] found ${outdatedTable.length} outdated package`)
}

export { doCheckOutdated }
