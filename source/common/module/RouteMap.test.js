import nodeModuleAssert from 'assert'
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
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '')
      nodeModuleAssert.equal(findRouteFromMap(routeMap, '').routeNode, routeNode)
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '/')
      nodeModuleAssert.equal(findRouteFromMap(routeMap, '/').routeNode, routeNode)
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '/a/b/c')
      nodeModuleAssert.equal(findRouteFromMap(routeMap, '/a/b/c').routeNode, routeNode)
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = {}
      const { routeNode } = parseRouteToMap(routeMap, '/a/b/c/')
      nodeModuleAssert.equal(findRouteFromMap(routeMap, '/a/b/c/').routeNode, routeNode)
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = {}
      const { routeNode, paramNameList } = parseRouteToMap(routeMap, '/:a/:b/:c/')
      nodeModuleAssert.deepEqual(paramNameList, [ 'a', 'b', 'c' ])
      nodeModuleAssert.equal(findRouteFromMap(routeMap, '/AAA/BBB/CCC/').routeNode, routeNode)
      nodeModuleAssert.deepEqual(findRouteFromMap(routeMap, '/AAA/BBB/CCC/').paramValueList, [ 'AAA', 'BBB', 'CCC' ])
    })
  })

  it('appendRouteMap()', () => {
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '', 'CUSTOM-DATA')
      nodeModuleAssert.equal(routeMap[ '' ][ '/DATA' ].route, '')
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/', 'CUSTOM-DATA')
      nodeModuleAssert.equal(routeMap[ '' ][ '' ][ '/DATA' ].route, '/')
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c', 'CUSTOM-DATA')
      nodeModuleAssert.equal(routeMap[ '' ].a.b.c[ '/DATA' ].route, '/a/b/c')
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c/', 'CUSTOM-DATA')
      nodeModuleAssert.equal(routeMap[ '' ].a.b.c[ '' ][ '/DATA' ].route, '/a/b/c/')
    })
  })

  it('createRouteMap()', () => {
    nodeModuleAssert.doesNotThrow(() => createRouteMap([
      [ '/test', 'CUSTOM-DATA' ],
      [ [ '/test/', '/test/test' ], 'CUSTOM-DATA' ]
    ]))
    nodeModuleAssert.doesNotThrow(() => createRouteMap([
      [ '/test/*', 'CUSTOM-DATA' ],
      [ '/test/:param', 'CUSTOM-DATA' ],
      [ '/test/:param/test', 'CUSTOM-DATA' ]
    ]))
    nodeModuleAssert.throws(() => createRouteMap([
      [ '/test', 'CUSTOM-DATA' ],
      [ '/test', 'CUSTOM-DATA' ]
    ]))
    nodeModuleAssert.throws(() => createRouteMap([
      [ '/test/*', 'CUSTOM-DATA' ],
      [ '/test/*', 'CUSTOM-DATA' ]
    ]))
    nodeModuleAssert.throws(() => createRouteMap([
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
    nodeModuleAssert.throws(() => parseRouteUrl(routeMap, '/a/test-param-any/a/b/c/d/e?f#g')) // wrong route
    nodeModuleAssert.throws(() => parseRouteUrl(routeMap, '/test')) // wrong route
    nodeModuleAssert.throws(() => parseRouteUrl(routeMap, '/test-param-a/aaa/bbb')) // too much param
    nodeModuleAssert.throws(() => parseRouteUrl(routeMap, '/test-param-b/b/c/d/eee/f')) // too much param
    nodeModuleAssert.throws(() => parseRouteUrl(routeMap, '/test-param-b/aaa')) // too few param
    nodeModuleAssert.throws(() => parseRouteUrl(routeMap, '/test-param-b/b/c/d/')) // too few param
    nodeModuleAssert.throws(() => parseRouteUrl(routeMap, '/test-param-b/b/c/d/ee')) // wrong frag
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-basic')
      nodeModuleAssert.equal(route, '/test-basic')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 0)
    }
  })

  it('getRouteParamAny()', () => {
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-any/')
      nodeModuleAssert.equal(route, '/test-param-any/*')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 1)
      nodeModuleAssert.equal(getRouteParamAny({ route, paramMap }), '')
    }
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-any/a---e')
      nodeModuleAssert.equal(route, '/test-param-any/*')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 1)
      nodeModuleAssert.equal(getRouteParamAny({ route, paramMap }), 'a---e')
    }
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-any/a/b/c/d/e')
      nodeModuleAssert.equal(route, '/test-param-any/*')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 1)
      nodeModuleAssert.equal(getRouteParamAny({ route, paramMap }), 'a/b/c/d/e')
    }
  })

  it('getRouteParam()', () => {
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-a/aaa-aaa')
      nodeModuleAssert.equal(route, '/test-param-a/:param-a')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 1)
      nodeModuleAssert.equal(getRouteParam({ route, paramMap }, 'param-a'), 'aaa-aaa')
    }
    {
      const { route, paramMap } = parseRouteUrl(routeMap, '/test-param-b/bbb-bbb/ccc-ccc/ddd-ddd/eee')
      nodeModuleAssert.equal(route, '/test-param-b/:param-b/:param-c/:param-d/eee')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 3)
      nodeModuleAssert.equal(getRouteParam({ route, paramMap }, 'param-b'), 'bbb-bbb')
      nodeModuleAssert.equal(getRouteParam({ route, paramMap }, 'param-c'), 'ccc-ccc')
      nodeModuleAssert.equal(getRouteParam({ route, paramMap }, 'param-d'), 'ddd-ddd')
    }
  })
})
