import { strictEqual, deepStrictEqual, throws, doesNotThrow } from 'assert'
import {
  parseRouteToMap,
  findRouteFromMap,
  appendRouteMap,
  createRouteMap,
  parseRouteUrl,
  getRouteParamAny,
  getRouteParam
} from './RouteMap'

const { describe, it } = global

describe('Common.Module.RouteMap', () => {
  it('parseRouteToMap(), findRouteFromMap()', () => {
    doesNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '')
      strictEqual(findRouteFromMap(routeMap, '').routeNode, routeNode)
    })
    doesNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '/')
      strictEqual(findRouteFromMap(routeMap, '/').routeNode, routeNode)
    })
    doesNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '/a/b/c')
      strictEqual(findRouteFromMap(routeMap, '/a/b/c').routeNode, routeNode)
    })
    doesNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '/a/b/c/')
      strictEqual(findRouteFromMap(routeMap, '/a/b/c/').routeNode, routeNode)
    })
    doesNotThrow(() => {
      const routeMap = {}
      const { routeNode, paramNameList } = parseRouteToMap(routeMap, '/:a/:b/:c/')
      deepStrictEqual(paramNameList, [ 'a', 'b', 'c' ])
      strictEqual(findRouteFromMap(routeMap, '/AAA/BBB/CCC/').routeNode, routeNode)
      deepStrictEqual(findRouteFromMap(routeMap, '/AAA/BBB/CCC/').paramValueList, [ 'AAA', 'BBB', 'CCC' ])
    })
  })

  it('appendRouteMap()', () => {
    doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '', 'CUSTOM-DATA')
      strictEqual(routeMap[ '' ][ '/DATA' ].route, '')
    })
    doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/', 'CUSTOM-DATA')
      strictEqual(routeMap[ '' ][ '' ][ '/DATA' ].route, '/')
    })
    doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c', 'CUSTOM-DATA')
      strictEqual(routeMap[ '' ].a.b.c[ '/DATA' ].route, '/a/b/c')
    })
    doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c/', 'CUSTOM-DATA')
      strictEqual(routeMap[ '' ].a.b.c[ '' ][ '/DATA' ].route, '/a/b/c/')
    })
  })

  it('createRouteMap()', () => {
    doesNotThrow(() => createRouteMap([
      [ '/test', 'CUSTOM-DATA' ],
      [ [ '/test/', '/test/test' ], 'CUSTOM-DATA' ]
    ]))
    doesNotThrow(() => createRouteMap([
      [ '/test/*', 'CUSTOM-DATA' ],
      [ '/test/:param', 'CUSTOM-DATA' ],
      [ '/test/:param/test', 'CUSTOM-DATA' ]
    ]))
    throws(() => createRouteMap([
      [ '/test', 'CUSTOM-DATA' ],
      [ '/test', 'CUSTOM-DATA' ]
    ]))
    throws(() => createRouteMap([
      [ '/test/*', 'CUSTOM-DATA' ],
      [ '/test/*', 'CUSTOM-DATA' ]
    ]))
    throws(() => createRouteMap([
      [ '/test/:param-a', 'CUSTOM-DATA' ],
      [ '/test/:param-b', 'CUSTOM-DATA' ]
    ]))
  })

  const routeMap = createRouteMap([
    [ '/test-basic', 'CUSTOM-DATA' ],
    [ '/test-param-any/*', 'CUSTOM-DATA' ],
    [ '/test-param-a/:param-a', 'CUSTOM-DATA' ],
    [ '/test-param-b/:param-b/:param-c/:param-d/eee', 'CUSTOM-DATA' ],
    [ [ '/', '/test/' ], 'CUSTOM-DATA' ]
  ])

  it('parseRouteUrl()', () => {
    throws(() => parseRouteUrl(routeMap, '/a/test-param-any/a/b/c/d/e?f#g')) // wrong route
    throws(() => parseRouteUrl(routeMap, '/test')) // wrong route
    throws(() => parseRouteUrl(routeMap, '/test-param-a/aaa/bbb')) // too much param
    throws(() => parseRouteUrl(routeMap, '/test-param-b/b/c/d/eee/f')) // too much param
    throws(() => parseRouteUrl(routeMap, '/test-param-b/aaa')) // too few param
    throws(() => parseRouteUrl(routeMap, '/test-param-b/b/c/d/')) // too few param
    throws(() => parseRouteUrl(routeMap, '/test-param-b/b/c/d/ee')) // wrong frag
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-basic')
      strictEqual(route, '/test-basic')
      strictEqual(Object.keys(paramMap).length, 0)
    }
  })

  it('getRouteParamAny()', () => {
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-any/')
      strictEqual(route, '/test-param-any/*')
      strictEqual(Object.keys(paramMap).length, 1)
      strictEqual(getRouteParamAny({ route, paramMap }), '')
    }
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-any/a---e')
      strictEqual(route, '/test-param-any/*')
      strictEqual(Object.keys(paramMap).length, 1)
      strictEqual(getRouteParamAny({ route, paramMap }), 'a---e')
    }
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-any/a/b/c/d/e')
      strictEqual(route, '/test-param-any/*')
      strictEqual(Object.keys(paramMap).length, 1)
      strictEqual(getRouteParamAny({ route, paramMap }), 'a/b/c/d/e')
    }
  })

  it('getRouteParam()', () => {
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-a/aaa-aaa')
      strictEqual(route, '/test-param-a/:param-a')
      strictEqual(Object.keys(paramMap).length, 1)
      strictEqual(getRouteParam({ route, paramMap }, 'param-a'), 'aaa-aaa')
    }
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-b/bbb-bbb/ccc-ccc/ddd-ddd/eee')
      strictEqual(route, '/test-param-b/:param-b/:param-c/:param-d/eee')
      strictEqual(Object.keys(paramMap).length, 3)
      strictEqual(getRouteParam({ route, paramMap }, 'param-b'), 'bbb-bbb')
      strictEqual(getRouteParam({ route, paramMap }, 'param-c'), 'ccc-ccc')
      strictEqual(getRouteParam({ route, paramMap }, 'param-d'), 'ddd-ddd')
    }
  })
})
