import { strictEqual, throws, doesNotThrow } from 'assert'
import { URL } from 'url'
import { createStateStoreLite } from 'source/common/immutable/StateStore'
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
    doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '', 'GET', () => {})
      strictEqual(routeMap[ '' ][ '/GET' ].route, '')
    })
    doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/', 'GET', () => {})
      strictEqual(routeMap[ '' ][ '' ][ '/GET' ].route, '/')
    })
    doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c', 'GET', () => {})
      strictEqual(routeMap[ '' ].a.b.c[ '/GET' ].route, '/a/b/c')
    })
    doesNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c/', 'GET', () => {})
      strictEqual(routeMap[ '' ].a.b.c[ '' ][ '/GET' ].route, '/a/b/c/')
    })
  })

  it('createRouteMap()', () => {
    doesNotThrow(() => createRouteMap([
      [ '/test', 'GET', () => {} ],
      [ [ '/test/', '/test/test' ], 'GET', () => {} ]
    ]))
    doesNotThrow(() => createRouteMap([
      [ '/test/*', 'GET', () => {} ],
      [ '/test/:param', [ 'GET', 'POST' ], () => {} ],
      [ '/test/:param/test', [ 'GET', 'POST' ], () => {} ]
    ]))
    throws(() => createRouteMap([
      [ '/test', 'GET' ]
    ]))
    throws(() => createRouteMap([
      [ '/test', 'GET', () => {} ],
      [ '/test', [ 'GET', 'POST' ], () => {} ]
    ]))
    throws(() => createRouteMap([
      [ '/test/*', 'GET', () => {} ],
      [ '/test/*', [ 'GET', 'POST' ], () => {} ]
    ]))
    throws(() => createRouteMap([
      [ '/test/:param-a', 'GET', () => {} ],
      [ '/test/:param-b', [ 'GET', 'POST' ], () => {} ]
    ]))
    throws(() => createRouteMap([
      [ '/test', 'STRANGE_METHOD', () => {} ]
    ]))
    throws(() => createRouteMap([
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
    throws(() => responderRouter(createStateStoreLite({ method: 'POST', url: new URL('aa://B/test-basic') }))) // no method 'POST' for route
    throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/a/test-param-any/a/b/c/d/e?f#g') }))) // wrong route
    throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-a/aaa/bbb') }))) // too much param
    throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-b/b/c/d/eee/f') }))) // too much param
    throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-b/aaa') }))) // too few param
    throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-b/b/c/d/') }))) // too few param
    throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-b/b/c/d/ee') }))) // wrong frag
    throws(() => responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test') }))) // wrong method route pair
    throws(() => responderRouter(createStateStoreLite({ method: 'POST', url: new URL('aa://B/test/') }))) // wrong method route pair
    {
      const store = createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-basic') })
      const { tag, route, paramMap } = responderRouter(store)
      strictEqual(tag, 'A')
      strictEqual(route, '/test-basic')
      strictEqual(Object.keys(paramMap).length, 0)
    }
    {
      const store = createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-any/a/b/c/d/e?f#g') })
      const { tag, route, paramMap } = responderRouter(store)
      strictEqual(tag, 'B')
      strictEqual(route, '/test-param-any/*')
      strictEqual(Object.keys(paramMap).length, 1)
      strictEqual(getRouteParamAny(store), 'a/b/c/d/e')
    }
    {
      const store = createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-a/aaa-aaa?f#g') })
      const { tag, route, paramMap } = responderRouter(store)
      strictEqual(tag, 'C')
      strictEqual(route, '/test-param-a/:param-a')
      strictEqual(Object.keys(paramMap).length, 1)
      strictEqual(getRouteParam(store, 'param-a'), 'aaa-aaa')
    }
    {
      const store = createStateStoreLite({ method: 'HEAD', url: new URL('aa://B/test-param-b/bbb-bbb/ccc-ccc/ddd-ddd/eee?f#g') })
      const { tag, route, paramMap } = responderRouter(store)
      strictEqual(tag, 'D')
      strictEqual(route, '/test-param-b/:param-b/:param-c/:param-d/eee')
      strictEqual(Object.keys(paramMap).length, 3)
      strictEqual(getRouteParam(store, 'param-b'), 'bbb-bbb')
      strictEqual(getRouteParam(store, 'param-c'), 'ccc-ccc')
      strictEqual(getRouteParam(store, 'param-d'), 'ddd-ddd')
    }
  })
})
