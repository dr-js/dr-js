# Export Info

* [Export Path](#export-path)
* [Export Tree](#export-tree)

#### Export Path
+ 📄 [source/env.js](source/env.js)
  - `getGlobal`, `getEnvironment`, `getSystemEndianness`, `assert`, `global`
+ 📄 [source/common/format.js](source/common/format.js)
  - `describe`, `time`, `binary`, `padTable`, `escapeHTML`, `unescapeHTML`, `stringIndentLine`, `stringListJoinCamelCase`
+ 📄 [source/common/function.js](source/common/function.js)
  - `debounce`, `throttle`, `repeat`, `createInsideOutPromise`, `promiseQueue`
+ 📄 [source/common/time.js](source/common/time.js)
  - `CLOCK_PER_SECOND`, `CLOCK_TO_SECOND`, `TIMESTAMP_START`, `clock`, `now`, `getTimestamp`, `setTimeoutAsync`, `setTimeoutPromise`, `onNextProperUpdate`
+ 📄 [source/common/verify.js](source/common/verify.js)
  - `string`, `number`, `integer`, `basicObject`, `objectKey`, `basicArray`, `arrayLength`, `basicFunction`, `oneOf`
+ 📄 [source/common/data/CacheMap.js](source/common/data/CacheMap.js)
  - `CacheMap`
+ 📄 [source/common/data/IdPool.js](source/common/data/IdPool.js)
  - `createIdPool`
+ 📄 [source/common/data/IndexBox.js](source/common/data/IndexBox.js)
  - `IndexBox`
+ 📄 [source/common/data/LinkedList.js](source/common/data/LinkedList.js)
  - `DoublyLinkedList`
+ 📄 [source/common/data/ListMap.js](source/common/data/ListMap.js)
  - `ListMap`
+ 📄 [source/common/data/LogQueue.js](source/common/data/LogQueue.js)
  - `createLogQueue`
+ 📄 [source/common/data/SetMap.js](source/common/data/SetMap.js)
  - `SetMap`
+ 📄 [source/common/data/Toggle.js](source/common/data/Toggle.js)
  - `createToggle`
+ 📄 [source/common/data/\_\_utils\_\_.js](source/common/data/__utils__.js)
  - `hashStringToNumber`, `objectMergeDeep`, `objectSortKey`, `isObjectContain`, `arraySplitChunk`
+ 📄 [source/common/geometry/Angle.js](source/common/geometry/Angle.js)
  - `DEGREE_TO_RADIAN`, `RADIAN_TO_DEGREE`, `fromDegree`, `getDegree`
+ 📄 [source/common/geometry/D2/BoundingRect.js](source/common/geometry/D2/BoundingRect.js)
  - `fromEmpty`, `fromPoint`, `fromWidget`, `fromWidgetList`, `getCenter`, `getUnion`, `isIntersect`, `isContainPoint`
+ 📄 [source/common/geometry/D2/Line.js](source/common/geometry/D2/Line.js)
  - `fromWidget`
+ 📄 [source/common/geometry/D2/Rect.js](source/common/geometry/D2/Rect.js)
  - `fromEmpty`, `fromPoint`, `fromBoundingRect`, `getCenter`, `getSize`, `getUnion`, `getUnionOfList`, `isEmpty`, `isIntersect`, `isContain`, `isContainPoint`
+ 📄 [source/common/geometry/D2/Vector.js](source/common/geometry/D2/Vector.js)
  - `fromOrigin`, `fromAngleLength`, `getLength`, `getLengthSq`, `getDist`, `getDistSq`, `getAngle`, `getRotate`, `getRotateDelta`, `add`, `sub`, `multiply`, `divide`, `scale`, `min`, `max`, `clamp`, `abs`, `round`
+ 📄 [source/common/geometry/D2/Widget.js](source/common/geometry/D2/Widget.js)
  - `fromPoint`, `fromLine`, `fromBoundingRect`, `getBoundingSize`, `getBoundingWidth`, `getBoundingHeight`, `getBoundingLeft`, `getBoundingRight`, `getBoundingTop`, `getBoundingBottom`, `round`, `localPoint`, `localBoundingRect`, `isContainBoundingRect`, `isInterceptBoundingRect`
+ 📄 [source/common/immutable/ImmutableOperation.js](source/common/immutable/ImmutableOperation.js)
  - `objectSet`, `objectDelete`, `objectMerge`, `arraySet`, `arrayDelete`, `arrayInsert`, `arrayMove`, `arrayPush`, `arrayUnshift`, `arrayPop`, `arrayShift`, `arrayConcat`, `arrayMatchPush`, `arrayMatchDelete`, `arrayMatchMove`, `arrayFindPush`, `arrayFindDelete`, `arrayFindMove`, `arrayFindSet`
+ 📄 [source/common/immutable/StateStore.js](source/common/immutable/StateStore.js)
  - `createStateStore`, `createStateStoreLite`, `createStateStoreEnhanced`, `toReduxStore`, `reducerFromMap`, `createEntryEnhancer`, `createStoreStateSyncReducer`
+ 📄 [source/common/immutable/\_\_utils\_\_.js](source/common/immutable/__utils__.js)
  - `immutableTransformCache`, `createImmutableTransformCacheWithInfo`
+ 📄 [source/common/math/base.js](source/common/math/base.js)
  - `roundFloat`, `clamp`, `euclideanModulo`, `smoothstep`
+ 📄 [source/common/math/random.js](source/common/math/random.js)
  - `getRandomInt`, `getRandomIntList`, `getRandomId`
+ 📄 [source/common/module/AsyncTaskQueue.js](source/common/module/AsyncTaskQueue.js)
  - `createAsyncTaskQueue`
+ 📄 [source/common/module/Event.js](source/common/module/Event.js)
  - `EventTarget`, `EventEmitter`
+ 📄 [source/common/module/KeySelector.js](source/common/module/KeySelector.js)
  - `concatKeyFrag`, `reduceKeySelector`, `createMultiKeySwitch`
+ 📄 [source/common/module/LevenshteinDistance.js](source/common/module/LevenshteinDistance.js)
  - `getLevenshteinDistance`
+ 📄 [source/common/module/MIME.js](source/common/module/MIME.js)
  - `DEFAULT_MIME`, `BASIC_MIME_MAP`, `BASIC_EXTENSION_MAP`, `getMIMETypeFromFileName`
+ 📄 [source/common/module/RouteMap.js](source/common/module/RouteMap.js)
  - `parseRouteToMap`, `findRouteFromMap`, `appendRouteMap`, `createRouteMap`, `parseRouteUrl`, `getRouteParamAny`, `getRouteParam`
+ 📄 [source/common/module/TaskRunner.js](source/common/module/TaskRunner.js)
  - `createTaskRunner`, `createTaskRunnerCluster`
+ 📄 [source/common/module/UpdateLoop.js](source/common/module/UpdateLoop.js)
  - `createUpdateLoop`
+ 📄 [source/common/module/Option/parser.js](source/common/module/Option/parser.js)
  - `createOptionParser`
+ 📄 [source/common/module/Option/preset.js](source/common/module/Option/preset.js)
  - `ConfigPreset`, `getOptionalFormatFlag`, `getOptionalFormatValue`
+ 📄 [source/common/module/StateSchema/ArrayOf.js](source/common/module/StateSchema/ArrayOf.js)
  - `ArrayOf`
+ 📄 [source/common/module/StateSchema/ArraySchema.js](source/common/module/StateSchema/ArraySchema.js)
  - `createArraySchema`
+ 📄 [source/common/module/StateSchema/ObjectAs.js](source/common/module/StateSchema/ObjectAs.js)
  - `ObjectAs`
+ 📄 [source/common/module/StateSchema/ObjectSchema.js](source/common/module/StateSchema/ObjectSchema.js)
  - `createObjectSchema`
+ 📄 [source/common/module/StateSchema/\_\_utils\_\_.js](source/common/module/StateSchema/__utils__.js)
  - `SCHEMA_MARK`, `isSchemaObject`, `toStructJSONWithCheck`, `getActionReducer`, `getReducer`
+ 📄 [source/common/module/StateSchema/actMap.js](source/common/module/StateSchema/actMap.js)
  - `objectActMap`, `arrayActMap`
+ 📄 [source/node/buffer.js](source/node/buffer.js)
  - `MAX_BUFFER_PACKET_SIZE`, `packBufferPacket`, `parseBufferPacket`
+ 📄 [source/node/resource.js](source/node/resource.js)
  - `fetch`, `urlToOption`, `requestAsync`, `receiveBufferAsync`, `sendBufferAsync`, `pipeStreamAsync`, `pingRequestAsync`, `loadScript`, `loadJSON`, `loadRemoteScript`, `loadRemoteJSON`, `loadLocalScript`, `loadLocalJSON`
+ 📄 [source/node/file/Compress.js](source/node/file/Compress.js)
  - `compressFile`, `compressFileList`, `checkBloat`
+ 📄 [source/node/file/Directory.js](source/node/file/Directory.js)
  - `getDirectoryContentNameList`, `getDirectoryContentFileList`, `getDirectoryContent`, `walkDirectoryContent`, `walkDirectoryContentBottomUp`, `walkDirectoryContentShallow`, `copyDirectoryContent`, `moveDirectoryContent`, `deleteDirectoryContent`, `getFileList`
+ 📄 [source/node/file/File.js](source/node/file/File.js)
  - `FILE_TYPE`, `getPathType`, `createDirectory`, `deletePath`, `movePath`, `copyPath`
+ 📄 [source/node/file/Modify.js](source/node/file/Modify.js)
  - `MODIFY_TYPE`, `modify`, `modifyFile`, `modifyDirectory`
+ 📄 [source/node/file/\_\_utils\_\_.js](source/node/file/__utils__.js)
  - `statAsync`, `lstatAsync`, `renameAsync`, `unlinkAsync`, `accessAsync`, `readableAsync`, `writableAsync`, `executableAsync`, `mkdirAsync`, `rmdirAsync`, `readdirAsync`, `readFileAsync`, `writeFileAsync`, `copyFileAsync`, `createReadStream`, `createWriteStream`, `createGetPathFromRoot`
+ 📄 [source/node/module/Command.js](source/node/module/Command.js)
  - `spawn`, `exec`, `withCwd`
+ 📄 [source/node/module/EntityTag.js](source/node/module/EntityTag.js)
  - `getEntityTagByContentHash`, `getWeakEntityTagByStat`
+ 📄 [source/node/module/FactDatabase.js](source/node/module/FactDatabase.js)
  - `createFactDatabase`
+ 📄 [source/node/module/Logger.js](source/node/module/Logger.js)
  - `createLogger`, `createSimpleLogger`
+ 📄 [source/node/module/Option.js](source/node/module/Option.js)
  - `parseOptionMap`, `createOptionGetter`
+ 📄 [source/node/module/SafeWrite.js](source/node/module/SafeWrite.js)
  - `createSafeWriteStream`
+ 📄 [source/node/server/Server.js](source/node/server/Server.js)
  - `createServer`, `createRequestListener`, `getUnusedPort`
+ 📄 [source/node/server/Responder/Common.js](source/node/server/Responder/Common.js)
  - `responderEnd`, `responderEndWithStatusCode`, `responderEndWithRedirect`, `responderSendBuffer`, `responderSendBufferRange`, `responderSendStream`, `responderSendStreamRange`, `responderSendJSON`, `createResponderParseURL`, `createResponderReceiveBuffer`, `createStoreStateAccessor`, `AccessorMap`
+ 📄 [source/node/server/Responder/Router.js](source/node/server/Responder/Router.js)
  - `createRouteMap`, `createResponderRouter`, `appendRouteMap`, `getRouteParamAny`, `getRouteParam`
+ 📄 [source/node/server/Responder/ServeStatic.js](source/node/server/Responder/ServeStatic.js)
  - `createResponderBufferCache`, `createResponderServeStatic`
+ 📄 [source/node/server/WebSocket/Frame.js](source/node/server/WebSocket/Frame.js)
  - `FRAME_TYPE_CONFIG_MAP`, `DATA_TYPE_MAP`, `DO_MASK_DATA`, `DO_NOT_MASK_DATA`, `FrameSender`, `FrameReceiver`
+ 📄 [source/node/server/WebSocket/WebSocketBase.js](source/node/server/WebSocket/WebSocketBase.js)
  - `WebSocketBase`
+ 📄 [source/node/server/WebSocket/WebSocketClient.js](source/node/server/WebSocket/WebSocketClient.js)
  - `WebSocketClient`, `createWebSocketClient`
+ 📄 [source/node/server/WebSocket/WebSocketServer.js](source/node/server/WebSocket/WebSocketServer.js)
  - `WebSocketServer`, `enableWebSocketServer`
+ 📄 [source/node/server/WebSocket/WebSocketUpgradeRequest.js](source/node/server/WebSocket/WebSocketUpgradeRequest.js)
  - `createUpdateRequestListener`
+ 📄 [source/node/server/WebSocket/\_\_utils\_\_.js](source/node/server/WebSocket/__utils__.js)
  - `DEFAULT_FRAME_LENGTH_LIMIT`, `WEB_SOCKET_VERSION`, `WEB_SOCKET_EVENT_MAP`, `getRequestKey`, `getRespondKey`
+ 📄 [source/node/system/DefaultOpen.js](source/node/system/DefaultOpen.js)
  - `getDefaultOpen`
+ 📄 [source/node/system/NetworkAddress.js](source/node/system/NetworkAddress.js)
  - `getNetworkIPv4AddressList`
+ 📄 [source/node/system/ProcessExitListener.js](source/node/system/ProcessExitListener.js)
  - `setProcessExitListener`
+ 📄 [source/node/system/REPL.js](source/node/system/REPL.js)
  - `startREPL`
+ 📄 [source/browser/DOM.js](source/browser/DOM.js)
  - `debounceByAnimationFrame`, `addDragFileListListenerToElement`, `bindLogElement`, `bindFPSElement`
+ 📄 [source/browser/blob.js](source/browser/blob.js)
  - `parseBlobAsText`, `parseBlobAsDataURL`, `parseBlobAsArrayBuffer`, `MAX_BLOB_PACKET_SIZE`, `packBlobPacket`, `parseBlobPacket`
+ 📄 [source/browser/input.js](source/browser/input.js)
  - `POINTER_EVENT_TYPE`, `applyPointerEventListener`, `ENHANCED_POINTER_EVENT_TYPE`, `applyPointerEnhancedEventListener`, `createKeyCommandListener`
+ 📄 [source/browser/resource.js](source/browser/resource.js)
  - `loadText`, `loadImage`, `loadScript`, `createDownload`, `createDownloadText`, `createDownloadBlob`
+ 📄 [source/browser/font/fontGenerator.js](source/browser/font/fontGenerator.js)
  - `createFontGenerator`
+ 📄 [source/browser/font/fontGeneratorBitmap.js](source/browser/font/fontGeneratorBitmap.js)
  - `createFontGeneratorBitmap`
+ 📄 [source/browser/font/fontMapper.js](source/browser/font/fontMapper.js)
  - `createFontMapper`
+ 📄 [source/browser/font/fontRender.js](source/browser/font/fontRender.js)
  - `createFontRender`
+ 📄 [source/browser/font/fontRenderBitmap.js](source/browser/font/fontRenderBitmap.js)
  - `createFontRenderBitmap`
+ 📄 [source/browser/graphic/CanvasImageDataOperation.js](source/browser/graphic/CanvasImageDataOperation.js)
  - `getPixelColor`, `replacePixelColor`, `drawPixel`, `drawPixelLine`, `drawPixelLineList`, `scale`, `crop`, `floodFill`
+ 📄 [source/browser/graphic/Color.js](source/browser/graphic/Color.js)
  - `getUint32RGBA`, `getRGBAFromUint32RGBA`, `getHexFromRGBA`, `getHexFromRGB`
+ 📄 [source/browser/graphic/ImageData.js](source/browser/graphic/ImageData.js)
  - `getQuickCanvas`, `getQuickContext2d`, `createImageElement`, `createCanvasElement`, `createCanvasImageData`, `applyImageElementExt`, `applyCanvasElementExt`, `applyCanvasImageDataExt`, `imageElementToCanvasElement`, `imageElementToCanvasImageData`, `canvasElementToCanvasImageData`, `canvasImageDataToCanvasElement`
+ 📄 [source/browser/module/HistoryStateStore.js](source/browser/module/HistoryStateStore.js)
  - `createHistoryStateStore`

#### Export Tree
- **Common**
  - **Data**
    - **CacheMap**
      - `CacheMap`
    - **IdPool**
      - `createIdPool`
    - **IndexBox**
      - `IndexBox`
    - **LinkedList**
      - `DoublyLinkedList`
    - **ListMap**
      - `ListMap`
    - **LogQueue**
      - `createLogQueue`
    - **SetMap**
      - `SetMap`
    - **Toggle**
      - `createToggle`
    - `hashStringToNumber`, `objectMergeDeep`, `objectSortKey`, `isObjectContain`, `arraySplitChunk`
  - **Geometry**
    - **D2**
      - **BoundingRect**
        - `fromEmpty`, `fromPoint`, `fromWidget`, `fromWidgetList`, `getCenter`, `getUnion`, `isIntersect`, `isContainPoint`
      - **Line**
        - `fromWidget`
      - **Rect**
        - `fromEmpty`, `fromPoint`, `fromBoundingRect`, `getCenter`, `getSize`, `getUnion`, `getUnionOfList`, `isEmpty`, `isIntersect`, `isContain`, `isContainPoint`
      - **Vector**
        - `fromOrigin`, `fromAngleLength`, `getLength`, `getLengthSq`, `getDist`, `getDistSq`, `getAngle`, `getRotate`, `getRotateDelta`, `add`, `sub`, `multiply`, `divide`, `scale`, `min`, `max`, `clamp`, `abs`, `round`
      - **Widget**
        - `fromPoint`, `fromLine`, `fromBoundingRect`, `getBoundingSize`, `getBoundingWidth`, `getBoundingHeight`, `getBoundingLeft`, `getBoundingRight`, `getBoundingTop`, `getBoundingBottom`, `round`, `localPoint`, `localBoundingRect`, `isContainBoundingRect`, `isInterceptBoundingRect`
    - **Angle**
      - `DEGREE_TO_RADIAN`, `RADIAN_TO_DEGREE`, `fromDegree`, `getDegree`
  - **Immutable**
    - **ImmutableOperation**
      - `objectSet`, `objectDelete`, `objectMerge`, `arraySet`, `arrayDelete`, `arrayInsert`, `arrayMove`, `arrayPush`, `arrayUnshift`, `arrayPop`, `arrayShift`, `arrayConcat`, `arrayMatchPush`, `arrayMatchDelete`, `arrayMatchMove`, `arrayFindPush`, `arrayFindDelete`, `arrayFindMove`, `arrayFindSet`
    - **StateStore**
      - `createStateStore`, `createStateStoreLite`, `createStateStoreEnhanced`, `toReduxStore`, `reducerFromMap`, `createEntryEnhancer`, `createStoreStateSyncReducer`
    - `immutableTransformCache`, `createImmutableTransformCacheWithInfo`
  - **Math**
    - `roundFloat`, `clamp`, `euclideanModulo`, `smoothstep`, `getRandomInt`, `getRandomIntList`, `getRandomId`
  - **Module**
    - **Option**
      - `createOptionParser`, `ConfigPreset`, `getOptionalFormatFlag`, `getOptionalFormatValue`
    - **StateSchema**
      - **ArrayOf**
        - `ArrayOf`
      - **ArraySchema**
        - `createArraySchema`
      - **ObjectAs**
        - `ObjectAs`
      - **ObjectSchema**
        - `createObjectSchema`
      - `SCHEMA_MARK`, `isSchemaObject`, `toStructJSONWithCheck`, `getActionReducer`, `getReducer`, `objectActMap`, `arrayActMap`
    - **AsyncTaskQueue**
      - `createAsyncTaskQueue`
    - **Event**
      - `EventTarget`, `EventEmitter`
    - **KeySelector**
      - `concatKeyFrag`, `reduceKeySelector`, `createMultiKeySwitch`
    - **LevenshteinDistance**
      - `getLevenshteinDistance`
    - **MIME**
      - `DEFAULT_MIME`, `BASIC_MIME_MAP`, `BASIC_EXTENSION_MAP`, `getMIMETypeFromFileName`
    - **RouteMap**
      - `parseRouteToMap`, `findRouteFromMap`, `appendRouteMap`, `createRouteMap`, `parseRouteUrl`, `getRouteParamAny`, `getRouteParam`
    - **TaskRunner**
      - `createTaskRunner`, `createTaskRunnerCluster`
    - **UpdateLoop**
      - `createUpdateLoop`
  - **Format**
    - `describe`, `time`, `binary`, `padTable`, `escapeHTML`, `unescapeHTML`, `stringIndentLine`, `stringListJoinCamelCase`
  - **Function**
    - `debounce`, `throttle`, `repeat`, `createInsideOutPromise`, `promiseQueue`
  - **Time**
    - `CLOCK_PER_SECOND`, `CLOCK_TO_SECOND`, `TIMESTAMP_START`, `clock`, `now`, `getTimestamp`, `setTimeoutAsync`, `setTimeoutPromise`, `onNextProperUpdate`
  - **Verify**
    - `string`, `number`, `integer`, `basicObject`, `objectKey`, `basicArray`, `arrayLength`, `basicFunction`, `oneOf`
- **Node**
  - **File**
    - **Compress**
      - `compressFile`, `compressFileList`, `checkBloat`
    - **Directory**
      - `getDirectoryContentNameList`, `getDirectoryContentFileList`, `getDirectoryContent`, `walkDirectoryContent`, `walkDirectoryContentBottomUp`, `walkDirectoryContentShallow`, `copyDirectoryContent`, `moveDirectoryContent`, `deleteDirectoryContent`, `getFileList`
    - **File**
      - `FILE_TYPE`, `getPathType`, `createDirectory`, `deletePath`, `movePath`, `copyPath`
    - **Modify**
      - `MODIFY_TYPE`, `modify`, `modifyFile`, `modifyDirectory`
    - `statAsync`, `lstatAsync`, `renameAsync`, `unlinkAsync`, `accessAsync`, `readableAsync`, `writableAsync`, `executableAsync`, `mkdirAsync`, `rmdirAsync`, `readdirAsync`, `readFileAsync`, `writeFileAsync`, `copyFileAsync`, `createReadStream`, `createWriteStream`, `createGetPathFromRoot`
  - **Module**
    - **Command**
      - `spawn`, `exec`, `withCwd`
    - **EntityTag**
      - `getEntityTagByContentHash`, `getWeakEntityTagByStat`
    - **FactDatabase**
      - `createFactDatabase`
    - **Logger**
      - `createLogger`, `createSimpleLogger`
    - **Option**
      - `parseOptionMap`, `createOptionGetter`
    - **SafeWrite**
      - `createSafeWriteStream`
  - **Server**
    - **Responder**
      - **Common**
        - `responderEnd`, `responderEndWithStatusCode`, `responderEndWithRedirect`, `responderSendBuffer`, `responderSendBufferRange`, `responderSendStream`, `responderSendStreamRange`, `responderSendJSON`, `createResponderParseURL`, `createResponderReceiveBuffer`, `createStoreStateAccessor`, `AccessorMap`
      - **Router**
        - `createRouteMap`, `createResponderRouter`, `appendRouteMap`, `getRouteParamAny`, `getRouteParam`
      - **ServeStatic**
        - `createResponderBufferCache`, `createResponderServeStatic`
    - **WebSocket**
      - **Frame**
        - `FRAME_TYPE_CONFIG_MAP`, `DATA_TYPE_MAP`, `DO_MASK_DATA`, `DO_NOT_MASK_DATA`, `FrameSender`, `FrameReceiver`
      - **WebSocketBase**
        - `WebSocketBase`
      - **WebSocketClient**
        - `WebSocketClient`, `createWebSocketClient`
      - **WebSocketServer**
        - `WebSocketServer`, `enableWebSocketServer`
      - **WebSocketUpgradeRequest**
        - `createUpdateRequestListener`
      - `DEFAULT_FRAME_LENGTH_LIMIT`, `WEB_SOCKET_VERSION`, `WEB_SOCKET_EVENT_MAP`, `getRequestKey`, `getRespondKey`
    - **Server**
      - `createServer`, `createRequestListener`, `getUnusedPort`
  - **System**
    - **DefaultOpen**
      - `getDefaultOpen`
    - **NetworkAddress**
      - `getNetworkIPv4AddressList`
    - **ProcessExitListener**
      - `setProcessExitListener`
    - **REPL**
      - `startREPL`
  - **Buffer**
    - `MAX_BUFFER_PACKET_SIZE`, `packBufferPacket`, `parseBufferPacket`
  - **Resource**
    - `fetch`, `urlToOption`, `requestAsync`, `receiveBufferAsync`, `sendBufferAsync`, `pipeStreamAsync`, `pingRequestAsync`, `loadScript`, `loadJSON`, `loadRemoteScript`, `loadRemoteJSON`, `loadLocalScript`, `loadLocalJSON`
- **Browser**
  - **Font**
    - `createFontGenerator`, `createFontGeneratorBitmap`, `createFontMapper`, `createFontRender`, `createFontRenderBitmap`
  - **Graphic**
    - **CanvasImageDataOperation**
      - `getPixelColor`, `replacePixelColor`, `drawPixel`, `drawPixelLine`, `drawPixelLineList`, `scale`, `crop`, `floodFill`
    - **Color**
      - `getUint32RGBA`, `getRGBAFromUint32RGBA`, `getHexFromRGBA`, `getHexFromRGB`
    - **ImageData**
      - `getQuickCanvas`, `getQuickContext2d`, `createImageElement`, `createCanvasElement`, `createCanvasImageData`, `applyImageElementExt`, `applyCanvasElementExt`, `applyCanvasImageDataExt`, `imageElementToCanvasElement`, `imageElementToCanvasImageData`, `canvasElementToCanvasImageData`, `canvasImageDataToCanvasElement`
  - **Module**
    - **HistoryStateStore**
      - `createHistoryStateStore`
  - **DOM**
    - `debounceByAnimationFrame`, `addDragFileListListenerToElement`, `bindLogElement`, `bindFPSElement`
  - **Blob**
    - `parseBlobAsText`, `parseBlobAsDataURL`, `parseBlobAsArrayBuffer`, `MAX_BLOB_PACKET_SIZE`, `packBlobPacket`, `parseBlobPacket`
  - **Input**
    - `POINTER_EVENT_TYPE`, `applyPointerEventListener`, `ENHANCED_POINTER_EVENT_TYPE`, `applyPointerEnhancedEventListener`, `createKeyCommandListener`
  - **Resource**
    - `loadText`, `loadImage`, `loadScript`, `createDownload`, `createDownloadText`, `createDownloadBlob`
- **Env**
  - `getGlobal`, `getEnvironment`, `getSystemEndianness`, `assert`, `global`