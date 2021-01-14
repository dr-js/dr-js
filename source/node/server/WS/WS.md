# Server Design


This WebSocket implementation starts from simplified code of https://github.com/websockets/ws,
  but the API never resembles the standard [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket),
  so let's just call this one `WS` instead, shorter and non-formal.

TODO & Problems:
  - WebSocket do not have backpressure, since the API is event based, the data must be consumed in time:
    https://stackoverflow.com/questions/19414277/can-i-have-flow-control-on-my-websockets
  - WebSocket in browser do not auto chunk data frame, also no API to manually chunk frame:
    https://stackoverflow.com/questions/13010354/chunking-websocket-transmission
  - WebSocket ping/pong do not have browser API, so browser client must use custom frame format to detect disconnection:
    https://stackoverflow.com/questions/10585355/sending-websocket-ping-pong-frame-from-browser

With above problems,
  usable `ping/pong/multi-chunk` for both client & server should be implemented with custom code,
  and send as structured data frames, so the related API will not be implemented in the WebSocket,
  only minimal code is added to support:
- server: auto ping by interval
- server/client: auto pong response
- server/client: multi-frame data receive, but not send

Current WS API use `AsyncIterator` to enable backpressure support, and dropped the event-based support,
  though it does not mean this can't work with other event-based code.
