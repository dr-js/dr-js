import { strictEqual, stringifyEqual, doThrow, doNotThrow } from 'source/common/verify'
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
    doNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '')
      strictEqual(findRouteFromMap(routeMap, '').routeNode, routeNode)
    })
    doNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '/')
      strictEqual(findRouteFromMap(routeMap, '/').routeNode, routeNode)
    })
    doNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '/a/b/c')
      strictEqual(findRouteFromMap(routeMap, '/a/b/c').routeNode, routeNode)
    })
    doNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '/a/b/c/')
      strictEqual(findRouteFromMap(routeMap, '/a/b/c/').routeNode, routeNode)
    })
    doNotThrow(() => {
      const routeMap = {}
      const { routeNode, paramNameList } = parseRouteToMap(routeMap, '/:a/:b/:c/')
      stringifyEqual(paramNameList, [ 'a', 'b', 'c' ])
      strictEqual(findRouteFromMap(routeMap, '/AAA/BBB/CCC/').routeNode, routeNode)
      stringifyEqual(findRouteFromMap(routeMap, '/AAA/BBB/CCC/').paramValueList, [ 'AAA', 'BBB', 'CCC' ])
    })
  })

  it('appendRouteMap()', () => {
    doNotThrow(() => {
      const routeMap = appendRouteMap({}, '', 'CUSTOM-DATA')
      strictEqual(routeMap[ '' ][ '/DATA' ].route, '')
    })
    doNotThrow(() => {
      const routeMap = appendRouteMap({}, '/', 'CUSTOM-DATA')
      strictEqual(routeMap[ '' ][ '' ][ '/DATA' ].route, '/')
    })
    doNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c', 'CUSTOM-DATA')
      strictEqual(routeMap[ '' ].a.b.c[ '/DATA' ].route, '/a/b/c')
    })
    doNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c/', 'CUSTOM-DATA')
      strictEqual(routeMap[ '' ].a.b.c[ '' ][ '/DATA' ].route, '/a/b/c/')
    })
  })

  it('createRouteMap()', () => {
    doNotThrow(() => createRouteMap([
      [ '/test', 'CUSTOM-DATA' ],
      [ [ '/test/', '/test/test' ], 'CUSTOM-DATA' ]
    ]))
    doNotThrow(() => createRouteMap([
      [ '/test/*', 'CUSTOM-DATA' ],
      [ '/test/:param', 'CUSTOM-DATA' ],
      [ '/test/:param/test', 'CUSTOM-DATA' ]
    ]))
    doThrow(() => createRouteMap([
      [ '/test', 'CUSTOM-DATA' ],
      [ '/test', 'CUSTOM-DATA' ]
    ]))
    doThrow(() => createRouteMap([
      [ '/test/*', 'CUSTOM-DATA' ],
      [ '/test/*', 'CUSTOM-DATA' ]
    ]))
    doThrow(() => createRouteMap([
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
    strictEqual(parseRouteUrl(routeMap, '/a/test-param-any/a/b/c/d/e?f#g'), undefined, `should skip: wrong route 0`)
    strictEqual(parseRouteUrl(routeMap, '/test'), undefined, `should skip: wrong route 1`)
    strictEqual(parseRouteUrl(routeMap, '/test-param-a/aaa/bbb'), undefined, `should skip: too much param 0`)
    strictEqual(parseRouteUrl(routeMap, '/test-param-b/b/c/d/eee/f'), undefined, `should skip: too much param 1`)
    strictEqual(parseRouteUrl(routeMap, '/test-param-b/aaa'), undefined, `should skip: too few param 0`)
    strictEqual(parseRouteUrl(routeMap, '/test-param-b/b/c/d/'), undefined, `should skip: too few param 1`)
    strictEqual(parseRouteUrl(routeMap, '/test-param-b/b/c/d/ee'), undefined, `should skip: wrong frag`)

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
