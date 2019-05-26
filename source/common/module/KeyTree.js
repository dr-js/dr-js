import { compareString } from 'source/common/compare'
import { createTreeDepthFirstSearch } from 'source/common/data/Tree'

// TODO: NOTE:
//   keyTreeJSON:
//     [
//       { key: 'key',
//          subList: [
//           { key: 'key',
//             subList: [
//               { key: 'key' },
//               { key: 'key' }
//             ]
//           },
//           { key: 'key' }
//         ]
//       },
//       { key: 'key' },
//       { key: 'key' }
//     ]
//   keyTreeString (compact save format)
//     `key[key[key,key]key]key,key`

// TODO: HACK:
//   for the replace method to work, the value should not have `{}[],":`
//   or just use [a-zA-Z0-9_-]

const REGEXP_NAME = /[\w-]+/

const createKeyTree = ({
  NAME_KEY = 'key', // should be /\w+/
  NAME_SUB_LIST = 'subList' // should be /\w+/
}) => {
  if (!REGEXP_NAME.test(NAME_KEY)) throw new Error(`expect ${NAME_KEY} to match: ${REGEXP_NAME}`)
  if (!REGEXP_NAME.test(NAME_SUB_LIST)) throw new Error(`expect ${NAME_SUB_LIST} to match: ${REGEXP_NAME}`)

  const stringify = (keyTreeJSON) => JSON.stringify(keyTreeJSON)
    .replace(REGEXP_MAX_BRACKET_LEFT, '[')
    .replace(REGEXP_MAX_BRACKET_RIGHT, (match, $1) => ']'.repeat($1.length / 2))
    .replace(REGEXP_MAX_COMMA, ',')
  const REGEXP_MAX_COMMA = new RegExp(`"},{"${NAME_KEY}":"`, 'g')
  const REGEXP_MAX_BRACKET_LEFT = new RegExp(`(?:","${NAME_SUB_LIST}":|^)\\[{"${NAME_KEY}":"`, 'g')
  const REGEXP_MAX_BRACKET_RIGHT = new RegExp(`"((?:}])+)(?:},{"${NAME_KEY}":"|$)`, 'g')

  const parse = (keyTreeString) => JSON.parse(
    keyTreeString
      .replace(REGEXP_MIN_COMMA, `"},{"${NAME_KEY}":"`)
      .replace(REGEXP_MIN_BRACKET_RIGHT, (match, $1, offset, string) => `"${'}]'.repeat($1.length)}${offset + match.length !== string.length ? `},{"${NAME_KEY}":"` : ''}`)
      .replace(REGEXP_MIN_BRACKET_LEFT, (match, offset) => `${offset !== 0 ? `","${NAME_SUB_LIST}":` : ''}[{"${NAME_KEY}":"`)
  )
  const REGEXP_MIN_COMMA = new RegExp(`,`, 'g')
  const REGEXP_MIN_BRACKET_LEFT = new RegExp(`\\[`, 'g')
  const REGEXP_MIN_BRACKET_RIGHT = new RegExp(`(]+)`, 'g')

  return { stringify, parse }
}

const createKeyTreeEnhanced = ({
  NAME_KEY = 'key', // should be /\w+/
  NAME_SUB_LIST = 'subList' // should be /\w+/
}) => {
  const createBuilder = (rootKey) => {
    const listMap = new Map()

    const add = (key, position, upperKey) => {
      let list = listMap.get(upperKey)
      if (list === undefined) {
        list = []
        listMap.set(upperKey, list)
      }
      list.push([ key, position ])
    }

    const build = () => {
      const rootSubList = []
      let initKey = rootKey
      while (initKey) {
        const { [ NAME_SUB_LIST ]: subList } = buildSub(initKey)
        __DEV__ && initKey !== rootKey && console.log(`appending unlinked ${NAME_KEY} from ${initKey}`, subList)
        if (subList !== undefined) rootSubList.push(...subList)
        initKey = listMap.keys().next().value
      }
      return rootSubList.length === 0
        ? { [ NAME_KEY ]: rootKey }
        : { [ NAME_KEY ]: rootKey, [ NAME_SUB_LIST ]: rootSubList }
    }
    const buildSub = (key) => {
      const object = { [ NAME_KEY ]: key }
      const subList = listMap.get(key)
      listMap.delete(key)
      if (subList !== undefined && subList.length !== 0) object[ NAME_SUB_LIST ] = subList.sort(sortFunc).map(([ subKey ]) => buildSub(subKey))
      return object
    }
    const sortFunc = ([ keyA, positionA ], [ keyB, positionB ]) => positionA - positionB || compareString(keyA, keyB)

    return { add, build }
  }

  const keyTreeJSONDepthFirstSearch = createTreeDepthFirstSearch(([ node, index, upperKey ]) => (
    node[ NAME_SUB_LIST ] &&
    node[ NAME_SUB_LIST ].length &&
    node[ NAME_SUB_LIST ].map((subNode, index) => [ subNode, index, node[ NAME_KEY ] ])
  ))
  const walkKeyTreeJSON = (
    keyTreeJSON,
    func = ([ node, index, upperKey ]) => {} // return true to stop search
  ) => keyTreeJSONDepthFirstSearch([ keyTreeJSON, 0, undefined ], func)

  return {
    ...createKeyTree({ NAME_KEY, NAME_SUB_LIST }),
    createBuilder,
    walkKeyTreeJSON
  }
}

export {
  createKeyTree,
  createKeyTreeEnhanced
}
