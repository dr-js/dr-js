import nodeModuleAssert from 'assert'
import { URL } from 'url'
import { createStateStoreLite } from 'source/common/immutable'
import {
  createRouteMap,
  createResponderRouter,
  appendRouteMap,
  getRouteParamAny,
  getRouteParam
} from './Router'

const { describe, it } = global

describe('Node.Server.Responder.Router', () => {
  it('appendRouteMap()', () => {
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '', 'GET', () => {})
      nodeModuleAssert.equal(routeMap[ '' ][ '/GET' ].route, '')
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/', 'GET', () => {})
      nodeModuleAssert.equal(routeMap[ '' ][ '' ][ '/GET' ].route, '/')
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c', 'GET', () => {})
      nodeModuleAssert.equal(routeMap[ '' ].a.b.c[ '/GET' ].route, '/a/b/c')
    })
    nodeModuleAssert.doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c/', 'GET', () => {})
      nodeModuleAssert.equal(routeMap[ '' ].a.b.c[ '' ][ '/GET' ].route, '/a/b/c/')
    })
  })

  it('createRouteMap()', () => {
    nodeModuleAssert.doesNotThrow(() => createRouteMap([
      [ '/test', 'GET', () => {} ],
      [ [ '/test/', '/test/test' ], 'GET', () => {} ]
    ]))
    nodeModuleAssert.doesNotThrow(() => createRouteMap([
      [ '/test/*', 'GET', () => {} ],
      [ '/test/:param', [ 'GET', 'POST' ], () => {} ],
      [ '/test/:param/test', [ 'GET', 'POST' ], () => {} ]
    ]))
    nodeModuleAssert.throws(() => createRouteMap([
      [ '/test', 'GET' ]
    ]))
    nodeModuleAssert.throws(() => createRouteMap([
      [ '/test', 'GET', () => {} ],
      [ '/test', [ 'GET', 'POST' ], () => {} ]
    ]))
    nodeModuleAssert.throws(() => createRouteMap([
      [ '/test/*', 'GET', () => {} ],
      [ '/test/*', [ 'GET', 'POST' ], () => {} ]
    ]))
    nodeModuleAssert.throws(() => createRouteMap([
      [ '/test/:param-a', 'GET', () => {} ],
      [ '/test/:param-b', [ 'GET', 'POST' ], () => {} ]
    ]))
    nodeModuleAssert.throws(() => createRouteMap([
      [ '/test', 'STRANGE_METHOD', () => {} ]
    ]))
    nodeModuleAssert.throws(() => createRouteMap([
      [ '/test', 'GET', () => {} ],
      [ '/test', [ 'GET', 'STRANGE_METHOD' ], () => {} ]
    ]))
  })

  const responderRouter = createResponderRouter(createRouteMap([
    [ '/test-basic', 'GET', (store, state) => ({ ...state, tag: 'A' }) ],
    [ '/test-param-any/*', 'GET', (store, state) => ({ ...state, tag: 'B' }) ],
    [ '/test-param-a/:param-a', 'GET', (store, state) => ({ ...state, tag: 'C' }) ],
    [ '/test-param-b/:param-b/:param-c/:param-d/eee', [ 'GET', 'HEAD' ], (store, state) => ({ ...state, tag: 'D' }) ],
    [ [ '/', '/test/' ], [ 'GET', 'HEAD' ], (store, state) => ({ ...state, tag: 'E' }) ],
    [ '/test', [ 'POST', 'HEAD' ], (store, state) => ({ ...state, tag: 'F' }) ]
  ]))

  it('createResponderRouter()', () => {
    nodeModuleAssert.throws(() => responderRouter(createStateStoreLite({ method: 'POST', url: new URL('aa://B/test-basic') }))) // no method 'POST' for route
    nodeModuleAssert.throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/a/test-param-any/a/b/c/d/e?f#g') }))) // wrong route
    nodeModuleAssert.throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-a/aaa/bbb') }))) // too much param
    nodeModuleAssert.throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-b/b/c/d/eee/f') }))) // too much param
    nodeModuleAssert.throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-b/aaa') }))) // too few param
    nodeModuleAssert.throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-b/b/c/d/') }))) // too few param
    nodeModuleAssert.throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-b/b/c/d/ee') }))) // wrong frag
    nodeModuleAssert.throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test') }))) // wrong method route pair
    nodeModuleAssert.throws(() => responderRouter(createStateStoreLite({ method: 'POST', url: new URL('aa://B/test/') }))) // wrong method route pair
    {
      const store = createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-basic') })
      const { tag, route, paramMap } = responderRouter(store)
      nodeModuleAssert.equal(tag, 'A')
      nodeModuleAssert.equal(route, '/test-basic')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 0)
    }
    {
      const store = createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-any/a/b/c/d/e?f#g') })
      const { tag, route, paramMap } = responderRouter(store)
      nodeModuleAssert.equal(tag, 'B')
      nodeModuleAssert.equal(route, '/test-param-any/*')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 1)
      nodeModuleAssert.equal(getRouteParamAny(store), 'a/b/c/d/e')
    }
    {
      const store = createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-a/aaa-aaa?f#g') })
      const { tag, route, paramMap } = responderRouter(store)
      nodeModuleAssert.equal(tag, 'C')
      nodeModuleAssert.equal(route, '/test-param-a/:param-a')
      nodeModuleAssert.equal(Object.keys(paramMap).length, 1)
      nodeModuleAssert.equal(getRouteParam(store, 'param-a'), 'aaa-aaa')
    }
    {
      const store = createStateStoreLite({ method: 'HEAD', url: new URL('aa://B/test-param-b/bbb-bbb/ccc-ccc/ddd-ddd/eee?f#g') })
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
