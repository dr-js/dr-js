import nodeModuleAssert from 'assert'
import { URL } from 'url'
import { createMinStateStore } from 'source/common/immutable'
import {
  createRouterMap,
  createResponderRouter,
  addRouteToRouterMap,
  getRouteParamAny,
  getRouteParam,
  parseRouteToMap,
  findRouteFromMap
} from './Router'

const { describe, it } = global

describe('Node.Server.Responder', () => {
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

  it('addRouteToRouterMap()', () => {
    nodeModuleAssert.doesNotThrow(() => {
      const routerMap = addRouteToRouterMap({}, '', 'GET', () => {})
      nodeModuleAssert.equal(routerMap[ '' ][ '/GET' ].route, '')
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routerMap = addRouteToRouterMap({}, '/', 'GET', () => {})
      nodeModuleAssert.equal(routerMap[ '' ][ '' ][ '/GET' ].route, '/')
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routerMap = addRouteToRouterMap({}, '/a/b/c', 'GET', () => {})
      nodeModuleAssert.equal(routerMap[ '' ].a.b.c[ '/GET' ].route, '/a/b/c')
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routerMap = addRouteToRouterMap({}, '/a/b/c/', 'GET', () => {})
      nodeModuleAssert.equal(routerMap[ '' ].a.b.c[ '' ][ '/GET' ].route, '/a/b/c/')
    })
  })

  it('createRouterMap()', () => {
    nodeModuleAssert.doesNotThrow(() => createRouterMap([
      [ '/test', 'GET', () => {} ],
      [ [ '/test/', '/test/test' ], 'GET', () => {} ]
    ]))
    nodeModuleAssert.doesNotThrow(() => createRouterMap([
      [ '/test/*', 'GET', () => {} ],
      [ '/test/:param', [ 'GET', 'POST' ], () => {} ],
      [ '/test/:param/test', [ 'GET', 'POST' ], () => {} ]
    ]))
    nodeModuleAssert.throws(() => createRouterMap([
      [ '/test', 'GET' ]
    ]))
    nodeModuleAssert.throws(() => createRouterMap([
      [ '/test', 'GET', () => {} ],
      [ '/test', [ 'GET', 'POST' ], () => {} ]
    ]))
    nodeModuleAssert.throws(() => createRouterMap([
      [ '/test/*', 'GET', () => {} ],
      [ '/test/*', [ 'GET', 'POST' ], () => {} ]
    ]))
    nodeModuleAssert.throws(() => createRouterMap([
      [ '/test/:param-a', 'GET', () => {} ],
      [ '/test/:param-b', [ 'GET', 'POST' ], () => {} ]
    ]))
    nodeModuleAssert.throws(() => createRouterMap([
      [ '/test', 'STRANGE_METHOD', () => {} ]
    ]))
    nodeModuleAssert.throws(() => createRouterMap([
      [ '/test', 'GET', () => {} ],
      [ '/test', [ 'GET', 'STRANGE_METHOD' ], () => {} ]
    ]))
  })

  const responderRouter = createResponderRouter(createRouterMap([
    [ '/test-basic', 'GET', (store, state) => ({ ...state, tag: 'A' }) ],
    [ '/test-param-any/*', 'GET', (store, state) => ({ ...state, tag: 'B' }) ],
    [ '/test-param-a/:param-a', 'GET', (store, state) => ({ ...state, tag: 'C' }) ],
    [ '/test-param-b/:param-b/:param-c/:param-d/eee', [ 'GET', 'HEAD' ], (store, state) => ({ ...state, tag: 'D' }) ],
    [ [ '/', '/test/' ], [ 'GET', 'HEAD' ], (store, state) => ({ ...state, tag: 'E' }) ],
    [ '/test', [ 'POST', 'HEAD' ], (store, state) => ({ ...state, tag: 'F' }) ]
  ]))

  it('createResponderRouter()', () => {
    nodeModuleAssert.throws(() => responderRouter(createMinStateStore({ method: 'POST', url: new URL('aa://B/test-basic') }))) // no method 'POST' for route
    nodeModuleAssert.throws(() => responderRouter(createMinStateStore({ method: 'GET', url: new URL('aa://B/a/test-param-any/a/b/c/d/e?f#g') }))) // wrong route
    nodeModuleAssert.throws(() => responderRouter(createMinStateStore({ method: 'GET', url: new URL('aa://B/test-param-a/aaa/bbb') }))) // too much param
    nodeModuleAssert.throws(() => responderRouter(createMinStateStore({ method: 'GET', url: new URL('aa://B/test-param-b/b/c/d/eee/f') }))) // too much param
    nodeModuleAssert.throws(() => responderRouter(createMinStateStore({ method: 'GET', url: new URL('aa://B/test-param-b/aaa') }))) // too few param
    nodeModuleAssert.throws(() => responderRouter(createMinStateStore({ method: 'GET', url: new URL('aa://B/test-param-b/b/c/d/') }))) // too few param
    nodeModuleAssert.throws(() => responderRouter(createMinStateStore({ method: 'GET', url: new URL('aa://B/test-param-b/b/c/d/ee') }))) // wrong frag
    nodeModuleAssert.throws(() => responderRouter(createMinStateStore({ method: 'GET', url: new URL('aa://B/test') }))) // wrong method route pair
    nodeModuleAssert.throws(() => responderRouter(createMinStateStore({ method: 'POST', url: new URL('aa://B/test/') }))) // wrong method route pair
    {
      const store = createMinStateStore({ method: 'GET', url: new URL('aa://B/test-basic') })
      const { tag, route, paramMap } = responderRouter(store)
      nodeModuleAssert.equal(tag, 'A')
      nodeModuleAssert.equal(route, '/test-basic')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 0)
    }
    {
      const store = createMinStateStore({ method: 'GET', url: new URL('aa://B/test-param-any/a/b/c/d/e?f#g') })
      const { tag, route, paramMap } = responderRouter(store)
      nodeModuleAssert.equal(tag, 'B')
      nodeModuleAssert.equal(route, '/test-param-any/*')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 1)
      nodeModuleAssert.equal(getRouteParamAny(store), 'a/b/c/d/e')
    }
    {
      const store = createMinStateStore({ method: 'GET', url: new URL('aa://B/test-param-a/aaa-aaa?f#g') })
      const { tag, route, paramMap } = responderRouter(store)
      nodeModuleAssert.equal(tag, 'C')
      nodeModuleAssert.equal(route, '/test-param-a/:param-a')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 1)
      nodeModuleAssert.equal(getRouteParam(store, 'param-a'), 'aaa-aaa')
    }
    {
      const store = createMinStateStore({ method: 'HEAD', url: new URL('aa://B/test-param-b/bbb-bbb/ccc-ccc/ddd-ddd/eee?f#g') })
      const { tag, route, paramMap } = responderRouter(store)
      nodeModuleAssert.equal(tag, 'D')
      nodeModuleAssert.equal(route, '/test-param-b/:param-b/:param-c/:param-d/eee')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 3)
      nodeModuleAssert.equal(getRouteParam(store, 'param-b'), 'bbb-bbb')
      nodeModuleAssert.equal(getRouteParam(store, 'param-c'), 'ccc-ccc')
      nodeModuleAssert.equal(getRouteParam(store, 'param-d'), 'ddd-ddd')
    }
  })
})
