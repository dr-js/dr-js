import { equal, deepEqual, throws, doesNotThrow } from 'assert'
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
      equal(findRouteFromMap(routeMap, '').routeNode, routeNode)
    })
    doesNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '/')
      equal(findRouteFromMap(routeMap, '/').routeNode, routeNode)
    })
    doesNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '/a/b/c')
      equal(findRouteFromMap(routeMap, '/a/b/c').routeNode, routeNode)
    })
    doesNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '/a/b/c/')
      equal(findRouteFromMap(routeMap, '/a/b/c/').routeNode, routeNode)
    })
    doesNotThrow(() => {
      const routeMap = {}
      const { routeNode, paramNameList } = parseRouteToMap(routeMap, '/:a/:b/:c/')
      deepEqual(paramNameList, [ 'a', 'b', 'c' ])
      equal(findRouteFromMap(routeMap, '/AAA/BBB/CCC/').routeNode, routeNode)
      deepEqual(findRouteFromMap(routeMap, '/AAA/BBB/CCC/').paramValueList, [ 'AAA', 'BBB', 'CCC' ])
    })
  })

  it('appendRouteMap()', () => {
    doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '', 'CUSTOM-DATA')
      equal(routeMap[ '' ][ '/DATA' ].route, '')
    })
    doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/', 'CUSTOM-DATA')
      equal(routeMap[ '' ][ '' ][ '/DATA' ].route, '/')
    })
    doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c', 'CUSTOM-DATA')
      equal(routeMap[ '' ].a.b.c[ '/DATA' ].route, '/a/b/c')
    })
    doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c/', 'CUSTOM-DATA')
      equal(routeMap[ '' ].a.b.c[ '' ][ '/DATA' ].route, '/a/b/c/')
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
      equal(route, '/test-basic')
      equal(Object.keys(paramMap).length, 0)
    }
  })

  it('getRouteParamAny()', () => {
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-any/')
      equal(route, '/test-param-any/*')
      equal(Object.keys(paramMap).length, 1)
      equal(getRouteParamAny({ route, paramMap }), '')
    }
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-any/a---e')
      equal(route, '/test-param-any/*')
      equal(Object.keys(paramMap).length, 1)
      equal(getRouteParamAny({ route, paramMap }), 'a---e')
    }
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-any/a/b/c/d/e')
      equal(route, '/test-param-any/*')
      equal(Object.keys(paramMap).length, 1)
      equal(getRouteParamAny({ route, paramMap }), 'a/b/c/d/e')
    }
  })

  it('getRouteParam()', () => {
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-a/aaa-aaa')
      equal(route, '/test-param-a/:param-a')
      equal(Object.keys(paramMap).length, 1)
      equal(getRouteParam({ route, paramMap }, 'param-a'), 'aaa-aaa')
    }
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-b/bbb-bbb/ccc-ccc/ddd-ddd/eee')
      equal(route, '/test-param-b/:param-b/:param-c/:param-d/eee')
      equal(Object.keys(paramMap).length, 3)
      equal(getRouteParam({ route, paramMap }, 'param-b'), 'bbb-bbb')
      equal(getRouteParam({ route, paramMap }, 'param-c'), 'ccc-ccc')
      equal(getRouteParam({ route, paramMap }, 'param-d'), 'ddd-ddd')
    }
  })
})
