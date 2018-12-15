import { URL } from 'url'
import { strictEqual, doThrow, doNotThrow } from 'source/common/verify'
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
    doNotThrow(() => {
      const routeMap = appendRouteMap({}, '', 'GET', () => {})
      strictEqual(routeMap[ '' ][ '/GET' ].route, '')
    })
    doNotThrow(() => {
      const routeMap = appendRouteMap({}, '/', 'GET', () => {})
      strictEqual(routeMap[ '' ][ '' ][ '/GET' ].route, '/')
    })
    doNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c', 'GET', () => {})
      strictEqual(routeMap[ '' ].a.b.c[ '/GET' ].route, '/a/b/c')
    })
    doNotThrow(() => {
      const routeMap = appendRouteMap({}, '/a/b/c/', 'GET', () => {})
      strictEqual(routeMap[ '' ].a.b.c[ '' ][ '/GET' ].route, '/a/b/c/')
    })
  })

  it('createRouteMap()', () => {
    doNotThrow(() => createRouteMap([
      [ '/test', 'GET', () => {} ],
      [ [ '/test/', '/test/test' ], 'GET', () => {} ]
    ]))
    doNotThrow(() => createRouteMap([
      [ '/test/*', 'GET', () => {} ],
      [ '/test/:param', [ 'GET', 'POST' ], () => {} ],
      [ '/test/:param/test', [ 'GET', 'POST' ], () => {} ]
    ]))
    doThrow(() => createRouteMap([
      [ '/test', 'GET' ]
    ]))
    doThrow(() => createRouteMap([
      [ '/test', 'GET', () => {} ],
      [ '/test', [ 'GET', 'POST' ], () => {} ]
    ]))
    doThrow(() => createRouteMap([
      [ '/test/*', 'GET', () => {} ],
      [ '/test/*', [ 'GET', 'POST' ], () => {} ]
    ]))
    doThrow(() => createRouteMap([
      [ '/test/:param-a', 'GET', () => {} ],
      [ '/test/:param-b', [ 'GET', 'POST' ], () => {} ]
    ]))
    doThrow(() => createRouteMap([
      [ '/test', 'STRANGE_METHOD', () => {} ]
    ]))
    doThrow(() => createRouteMap([
      [ '/test', 'GET', () => {} ],
      [ '/test', [ 'GET', 'STRANGE_METHOD' ], () => {} ]
    ]))
  })

  const responderRouter = createResponderRouter({
    routeMap: createRouteMap([
      [ '/test-basic', 'GET', (store, state) => ({ ...state, tag: 'A' }) ],
      [ '/test-param-any/*', 'GET', (store, state) => ({ ...state, tag: 'B' }) ],
      [ '/test-param-a/:param-a', 'GET', (store, state) => ({ ...state, tag: 'C' }) ],
      [ '/test-param-b/:param-b/:param-c/:param-d/eee', [ 'GET', 'HEAD' ], (store, state) => ({ ...state, tag: 'D' }) ],
      [ [ '/', '/test/' ], [ 'GET', 'HEAD' ], (store, state) => ({ ...state, tag: 'E' }) ],
      [ '/test', [ 'POST', 'HEAD' ], (store, state) => ({ ...state, tag: 'F' }) ]
    ]),
    getMethodUrl: (store) => store.getState()
  })

  it('createResponderRouter()', () => {
    strictEqual(responderRouter(createStateStoreLite({ method: 'POST', url: new URL('aa://B/test-basic') })), undefined, `should skip: no method 'POST' for route`)
    strictEqual(responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/a/test-param-any/a/b/c/d/e?f#g') })), undefined, `should skip: wrong route`)
    strictEqual(responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-a/aaa/bbb') })), undefined, `should skip: too much param 0`)
    strictEqual(responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-b/b/c/d/eee/f') })), undefined, `should skip: too much param 1`)
    strictEqual(responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-b/aaa') })), undefined, `should skip: too few param 0`)
    strictEqual(responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-b/b/c/d/') })), undefined, `should skip: too few param 1`)
    strictEqual(responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test-param-b/b/c/d/ee') })), undefined, `should skip: wrong frag`)
    strictEqual(responderRouter(createStateStoreLite({ method: 'GET', url: new URL('aa://B/test') })), undefined, `should skip: wrong method route pair 0`)
    strictEqual(responderRouter(createStateStoreLite({ method: 'POST', url: new URL('aa://B/test/') })), undefined, `should skip: wrong method route pair 1`)

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
