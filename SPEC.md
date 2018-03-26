# Specification

* [Export Path](#export-path)
* [Export Tree](#export-tree)
* [Bin Option Format](#bin-option-format)

#### Export Path
+ 📄 [source/env.js](source/env.js)
  - `getGlobal`, `getEnvironment`, `getSystemEndianness`, `assert`, `global`
+ 📄 [source/common/check.js](source/common/check.js)
  - `isString`, `isNumber`, `isInteger`, `isBasicObject`, `isObjectKey`, `isObjectContain`, `isBasicArray`, `isArrayLength`, `isBasicFunction`, `isOneOf`
+ 📄 [source/common/compare.js](source/common/compare.js)
  - `compareString`, `compareStringLocale`
+ 📄 [source/common/format.js](source/common/format.js)
  - `describe`, `time`, `binary`, `padTable`, `escapeHTML`, `unescapeHTML`, `stringIndentLine`, `stringListJoinCamelCase`
+ 📄 [source/common/function.js](source/common/function.js)
  - `debounce`, `throttle`, `withDelayArgvQueue`, `withRepeat`, `withRetryAsync`, `createInsideOutPromise`, `promiseQueue`
+ 📄 [source/common/time.js](source/common/time.js)
  - `CLOCK_PER_SECOND`, `CLOCK_TO_SECOND`, `TIMESTAMP_START`, `clock`, `now`, `getTimestamp`, `setTimeoutAsync`, `setTimeoutPromise`, `requestFrameUpdate`, `cancelFrameUpdate`, `createTimer`
+ 📄 [source/common/verify.js](source/common/verify.js)
  - `string`, `number`, `integer`, `basicObject`, `objectKey`, `objectContain`, `basicArray`, `arrayLength`, `basicFunction`, `oneOf`
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
+ 📄 [source/common/data/SaveQueue.js](source/common/data/SaveQueue.js)
  - `createSaveQueue`
+ 📄 [source/common/data/SemVer.js](source/common/data/SemVer.js)
  - `parseSemVer`, `compareSemVer`
+ 📄 [source/common/data/SetMap.js](source/common/data/SetMap.js)
  - `SetMap`
+ 📄 [source/common/data/Toggle.js](source/common/data/Toggle.js)
  - `createToggle`
+ 📄 [source/common/data/function.js](source/common/data/function.js)
  - `hashStringToNumber`, `tryParseJSONObject`
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
+ 📄 [source/common/immutable/Array.js](source/common/immutable/Array.js)
  - `arraySet`, `arrayDelete`, `arrayInsert`, `arrayMove`, `arrayPush`, `arrayUnshift`, `arrayPop`, `arrayShift`, `arrayConcat`, `arrayMatchPush`, `arrayMatchDelete`, `arrayMatchMove`, `arrayFindPush`, `arrayFindDelete`, `arrayFindMove`, `arrayFindSet`, `arraySplitChunk`
+ 📄 [source/common/immutable/Object.js](source/common/immutable/Object.js)
  - `objectSet`, `objectDelete`, `objectMerge`
+ 📄 [source/common/immutable/StateStore.js](source/common/immutable/StateStore.js)
  - `createStateStore`, `createStateStoreLite`, `createStateStoreEnhanced`, `toReduxStore`, `reducerFromMap`, `createEntryEnhancer`, `createStoreStateSyncReducer`
+ 📄 [source/common/immutable/function.js](source/common/immutable/function.js)
  - `transformCache`, `createTransformCacheWithInfo`
+ 📄 [source/common/math/base.js](source/common/math/base.js)
  - `roundFloat`, `clamp`, `euclideanModulo`, `smoothstep`
+ 📄 [source/common/math/random.js](source/common/math/random.js)
  - `getRandomInt`, `getRandomIntList`, `getRandomId`
+ 📄 [source/common/module/AsyncTaskQueue.js](source/common/module/AsyncTaskQueue.js)
  - `createAsyncTaskQueue`
+ 📄 [source/common/module/Event.js](source/common/module/Event.js)
  - `createHub`, `createEventTarget`, `createEventEmitter`
+ 📄 [source/common/module/KeySelector.js](source/common/module/KeySelector.js)
  - `concatKeyFrag`, `reduceKeySelector`, `createMultiKeySwitch`
+ 📄 [source/common/module/LevenshteinDistance.js](source/common/module/LevenshteinDistance.js)
  - `getLevenshteinDistance`
+ 📄 [source/common/module/MIME.js](source/common/module/MIME.js)
  - `DEFAULT_MIME`, `BASIC_MIME_LIST_MAP`, `BASIC_EXTENSION_MAP`, `getMIMETypeFromFileName`
+ 📄 [source/common/module/RouteMap.js](source/common/module/RouteMap.js)
  - `parseRouteToMap`, `findRouteFromMap`, `appendRouteMap`, `createRouteMap`, `parseRouteUrl`, `getRouteParamAny`, `getRouteParam`
+ 📄 [source/common/module/TaskRunner.js](source/common/module/TaskRunner.js)
  - `createTaskRunner`, `createTaskRunnerCluster`
+ 📄 [source/common/module/UpdateLoop.js](source/common/module/UpdateLoop.js)
  - `createUpdater`, `createUpdateLoop`
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
+ 📄 [source/common/module/StateSchema/actMap.js](source/common/module/StateSchema/actMap.js)
  - `objectActMap`, `arrayActMap`
+ 📄 [source/common/module/StateSchema/function.js](source/common/module/StateSchema/function.js)
  - `SCHEMA_MARK`, `isSchemaObject`, `toStructJSONWithCheck`, `getActionReducer`, `getReducer`
+ 📄 [source/common/mutable/Object.js](source/common/mutable/Object.js)
  - `objectMergeDeep`, `objectSortKey`
+ 📄 [source/node/net.js](source/node/net.js)
  - `urlToOption`, `requestAsync`, `fetch`, `ping`
+ 📄 [source/node/resource.js](source/node/resource.js)
  - `loadRemoteScript`, `loadLocalScript`, `loadScript`, `loadRemoteJSON`, `loadLocalJSON`, `loadJSON`
+ 📄 [source/node/data/Buffer.js](source/node/data/Buffer.js)
  - `receiveBufferAsync`, `sendBufferAsync`
+ 📄 [source/node/data/BufferPacket.js](source/node/data/BufferPacket.js)
  - `MAX_BUFFER_PACKET_SIZE`, `packBufferPacket`, `parseBufferPacket`
+ 📄 [source/node/data/LogQueue.js](source/node/data/LogQueue.js)
  - `createLogQueue`
+ 📄 [source/node/data/Stream.js](source/node/data/Stream.js)
  - `pipeStreamAsync`
+ 📄 [source/node/file/Compress.js](source/node/file/Compress.js)
  - `compressFile`, `compressFileList`, `checkBloat`
+ 📄 [source/node/file/Directory.js](source/node/file/Directory.js)
  - `getDirectoryContentNameList`, `getDirectoryContent`, `getDirectoryContentShallow`, `walkDirectoryContent`, `walkDirectoryContentBottomUp`, `walkDirectoryContentShallow`, `copyDirectoryContent`, `moveDirectoryContent`, `deleteDirectoryContent`, `getFileList`
+ 📄 [source/node/file/File.js](source/node/file/File.js)
  - `FILE_TYPE`, `getPathType`, `createDirectory`, `deletePath`, `movePath`, `copyPath`
+ 📄 [source/node/file/Modify.js](source/node/file/Modify.js)
  - `copyFile`, `moveFile`, `deleteFile`, `copyDirectory`, `moveDirectory`, `deleteDirectory`, `modify`, `withTempDirectory`
+ 📄 [source/node/file/Watch.js](source/node/file/Watch.js)
  - `createFileWatcher`
+ 📄 [source/node/file/function.js](source/node/file/function.js)
  - `statAsync`, `lstatAsync`, `renameAsync`, `unlinkAsync`, `accessAsync`, `visibleAsync`, `readableAsync`, `writableAsync`, `executableAsync`, `mkdirAsync`, `rmdirAsync`, `readdirAsync`, `readFileAsync`, `writeFileAsync`, `copyFileAsync`, `nearestExistAsync`, `createReadStream`, `createWriteStream`, `createPathPrefixLock`, `toPosixPath`, `trimPathDepth`
+ 📄 [source/node/module/EntityTag.js](source/node/module/EntityTag.js)
  - `getEntityTagByContentHash`, `getWeakEntityTagByStat`
+ 📄 [source/node/module/FactDatabase.js](source/node/module/FactDatabase.js)
  - `createFactDatabase`, `tryDeleteExtraCache`
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
  - `FrameSender`, `FrameReceiver`
+ 📄 [source/node/server/WebSocket/WebSocketBase.js](source/node/server/WebSocket/WebSocketBase.js)
  - `WebSocketBase`
+ 📄 [source/node/server/WebSocket/WebSocketClient.js](source/node/server/WebSocket/WebSocketClient.js)
  - `WebSocketClient`, `createWebSocketClient`
+ 📄 [source/node/server/WebSocket/WebSocketServer.js](source/node/server/WebSocket/WebSocketServer.js)
  - `WebSocketServer`, `enableWebSocketServer`
+ 📄 [source/node/server/WebSocket/WebSocketUpgradeRequest.js](source/node/server/WebSocket/WebSocketUpgradeRequest.js)
  - `createUpdateRequestListener`
+ 📄 [source/node/server/WebSocket/type.js](source/node/server/WebSocket/type.js)
  - `FRAME_TYPE_CONFIG_MAP`, `DATA_TYPE_MAP`, `DO_MASK_DATA`, `DO_NOT_MASK_DATA`, `DEFAULT_FRAME_LENGTH_LIMIT`, `WEB_SOCKET_VERSION`, `WEB_SOCKET_EVENT_MAP`, `getRequestKey`, `getRespondKey`
+ 📄 [source/node/system/DefaultOpen.js](source/node/system/DefaultOpen.js)
  - `getDefaultOpen`
+ 📄 [source/node/system/NetworkAddress.js](source/node/system/NetworkAddress.js)
  - `getNetworkIPv4AddressList`
+ 📄 [source/node/system/ProcessExitListener.js](source/node/system/ProcessExitListener.js)
  - `setProcessExitListener`
+ 📄 [source/node/system/REPL.js](source/node/system/REPL.js)
  - `startREPL`
+ 📄 [source/node/system/Run.js](source/node/system/Run.js)
  - `run`, `runSync`, `runQuiet`, `withCwd`
+ 📄 [source/browser/DOM.js](source/browser/DOM.js)
  - `throttleByAnimationFrame`, `applyDragFileListListener`
+ 📄 [source/browser/input.js](source/browser/input.js)
  - `POINTER_EVENT_TYPE`, `applyPointerEventListener`, `ENHANCED_POINTER_EVENT_TYPE`, `applyPointerEnhancedEventListener`, `createKeyCommandListener`
+ 📄 [source/browser/net.js](source/browser/net.js)
  - `fetchLikeRequest`
+ 📄 [source/browser/resource.js](source/browser/resource.js)
  - `loadText`, `loadImage`, `loadScript`, `createDownload`, `createDownloadText`, `createDownloadBlob`
+ 📄 [source/browser/data/Blob.js](source/browser/data/Blob.js)
  - `Blob`, `parseBlobAsText`, `parseBlobAsDataURL`, `parseBlobAsArrayBuffer`
+ 📄 [source/browser/data/BlobPacket.js](source/browser/data/BlobPacket.js)
  - `MAX_BLOB_PACKET_SIZE`, `packBlobPacket`, `parseBlobPacket`
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
    - **SaveQueue**
      - `createSaveQueue`
    - **SemVer**
      - `parseSemVer`, `compareSemVer`
    - **SetMap**
      - `SetMap`
    - **Toggle**
      - `createToggle`
    - `hashStringToNumber`, `tryParseJSONObject`
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
    - **Array**
      - `arraySet`, `arrayDelete`, `arrayInsert`, `arrayMove`, `arrayPush`, `arrayUnshift`, `arrayPop`, `arrayShift`, `arrayConcat`, `arrayMatchPush`, `arrayMatchDelete`, `arrayMatchMove`, `arrayFindPush`, `arrayFindDelete`, `arrayFindMove`, `arrayFindSet`, `arraySplitChunk`
    - **Object**
      - `objectSet`, `objectDelete`, `objectMerge`
    - **StateStore**
      - `createStateStore`, `createStateStoreLite`, `createStateStoreEnhanced`, `toReduxStore`, `reducerFromMap`, `createEntryEnhancer`, `createStoreStateSyncReducer`
    - `transformCache`, `createTransformCacheWithInfo`
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
      - `objectActMap`, `arrayActMap`, `SCHEMA_MARK`, `isSchemaObject`, `toStructJSONWithCheck`, `getActionReducer`, `getReducer`
    - **AsyncTaskQueue**
      - `createAsyncTaskQueue`
    - **Event**
      - `createHub`, `createEventTarget`, `createEventEmitter`
    - **KeySelector**
      - `concatKeyFrag`, `reduceKeySelector`, `createMultiKeySwitch`
    - **LevenshteinDistance**
      - `getLevenshteinDistance`
    - **MIME**
      - `DEFAULT_MIME`, `BASIC_MIME_LIST_MAP`, `BASIC_EXTENSION_MAP`, `getMIMETypeFromFileName`
    - **RouteMap**
      - `parseRouteToMap`, `findRouteFromMap`, `appendRouteMap`, `createRouteMap`, `parseRouteUrl`, `getRouteParamAny`, `getRouteParam`
    - **TaskRunner**
      - `createTaskRunner`, `createTaskRunnerCluster`
    - **UpdateLoop**
      - `createUpdater`, `createUpdateLoop`
  - **Mutable**
    - **Object**
      - `objectMergeDeep`, `objectSortKey`
  - **Check**
    - `isString`, `isNumber`, `isInteger`, `isBasicObject`, `isObjectKey`, `isObjectContain`, `isBasicArray`, `isArrayLength`, `isBasicFunction`, `isOneOf`
  - **Compare**
    - `compareString`, `compareStringLocale`
  - **Format**
    - `describe`, `time`, `binary`, `padTable`, `escapeHTML`, `unescapeHTML`, `stringIndentLine`, `stringListJoinCamelCase`
  - **Function**
    - `debounce`, `throttle`, `withDelayArgvQueue`, `withRepeat`, `withRetryAsync`, `createInsideOutPromise`, `promiseQueue`
  - **Time**
    - `CLOCK_PER_SECOND`, `CLOCK_TO_SECOND`, `TIMESTAMP_START`, `clock`, `now`, `getTimestamp`, `setTimeoutAsync`, `setTimeoutPromise`, `requestFrameUpdate`, `cancelFrameUpdate`, `createTimer`
  - **Verify**
    - `string`, `number`, `integer`, `basicObject`, `objectKey`, `objectContain`, `basicArray`, `arrayLength`, `basicFunction`, `oneOf`
- **Node**
  - **Data**
    - **Buffer**
      - `receiveBufferAsync`, `sendBufferAsync`
    - **BufferPacket**
      - `MAX_BUFFER_PACKET_SIZE`, `packBufferPacket`, `parseBufferPacket`
    - **LogQueue**
      - `createLogQueue`
    - **Stream**
      - `pipeStreamAsync`
  - **File**
    - **Compress**
      - `compressFile`, `compressFileList`, `checkBloat`
    - **Directory**
      - `getDirectoryContentNameList`, `getDirectoryContent`, `getDirectoryContentShallow`, `walkDirectoryContent`, `walkDirectoryContentBottomUp`, `walkDirectoryContentShallow`, `copyDirectoryContent`, `moveDirectoryContent`, `deleteDirectoryContent`, `getFileList`
    - **File**
      - `FILE_TYPE`, `getPathType`, `createDirectory`, `deletePath`, `movePath`, `copyPath`
    - **Modify**
      - `copyFile`, `moveFile`, `deleteFile`, `copyDirectory`, `moveDirectory`, `deleteDirectory`, `modify`, `withTempDirectory`
    - **Watch**
      - `createFileWatcher`
    - `statAsync`, `lstatAsync`, `renameAsync`, `unlinkAsync`, `accessAsync`, `visibleAsync`, `readableAsync`, `writableAsync`, `executableAsync`, `mkdirAsync`, `rmdirAsync`, `readdirAsync`, `readFileAsync`, `writeFileAsync`, `copyFileAsync`, `nearestExistAsync`, `createReadStream`, `createWriteStream`, `createPathPrefixLock`, `toPosixPath`, `trimPathDepth`
  - **Module**
    - **EntityTag**
      - `getEntityTagByContentHash`, `getWeakEntityTagByStat`
    - **FactDatabase**
      - `createFactDatabase`, `tryDeleteExtraCache`
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
        - `FrameSender`, `FrameReceiver`
      - **WebSocketBase**
        - `WebSocketBase`
      - **WebSocketClient**
        - `WebSocketClient`, `createWebSocketClient`
      - **WebSocketServer**
        - `WebSocketServer`, `enableWebSocketServer`
      - **WebSocketUpgradeRequest**
        - `createUpdateRequestListener`
      - `FRAME_TYPE_CONFIG_MAP`, `DATA_TYPE_MAP`, `DO_MASK_DATA`, `DO_NOT_MASK_DATA`, `DEFAULT_FRAME_LENGTH_LIMIT`, `WEB_SOCKET_VERSION`, `WEB_SOCKET_EVENT_MAP`, `getRequestKey`, `getRespondKey`
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
    - **Run**
      - `run`, `runSync`, `runQuiet`, `withCwd`
  - **Net**
    - `urlToOption`, `requestAsync`, `fetch`, `ping`
  - **Resource**
    - `loadRemoteScript`, `loadLocalScript`, `loadScript`, `loadRemoteJSON`, `loadLocalJSON`, `loadJSON`
- **Browser**
  - **Data**
    - **Blob**
      - `Blob`, `parseBlobAsText`, `parseBlobAsDataURL`, `parseBlobAsArrayBuffer`
    - **BlobPacket**
      - `MAX_BLOB_PACKET_SIZE`, `packBlobPacket`, `parseBlobPacket`
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
    - `throttleByAnimationFrame`, `applyDragFileListListener`
  - **Input**
    - `POINTER_EVENT_TYPE`, `applyPointerEventListener`, `ENHANCED_POINTER_EVENT_TYPE`, `applyPointerEnhancedEventListener`, `createKeyCommandListener`
  - **Net**
    - `fetchLikeRequest`
  - **Resource**
    - `loadText`, `loadImage`, `loadScript`, `createDownload`, `createDownloadText`, `createDownloadBlob`
- **Env**
  - `getGlobal`, `getEnvironment`, `getSystemEndianness`, `assert`, `global`

#### Bin Option Format
📄 [source-bin/option.js](source-bin/option.js)
> ```
> CLI Usage:
>   --config -c [OPTIONAL] [ARGUMENT=1]
>       # from JSON: set to 'path/to/config.json'
>       # from ENV: set to 'env'
>   --help -h [OPTIONAL]
>       set to enable
>   --version -v [OPTIONAL]
>       set to enable
>   --mode -m [OPTIONAL] [ARGUMENT=1]
>       one of:
>         open o
>         file-list ls
>         file-list-all ls-R
>         file-create-directory mkdir
>         file-modify-copy cp
>         file-modify-move mv
>         file-modify-delete rm
>         server-test-connection stc
>         server-serve-static sss
>         server-serve-static-simple ssss
>         server-websocket-group swg
>     --argument -a [OPTIONAL-CHECK]
>         different for each mode
>     --quiet -q [OPTIONAL-CHECK]
>         set to enable
> ENV Usage:
>   "
>     #!/usr/bin/env bash
>     export DR_JS_CONFIG="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_HELP="[OPTIONAL]"
>     export DR_JS_VERSION="[OPTIONAL]"
>     export DR_JS_MODE="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_ARGUMENT="[OPTIONAL-CHECK]"
>     export DR_JS_QUIET="[OPTIONAL-CHECK]"
>   "
> JSON Usage:
>   {
>     "drJsConfig": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "drJsHelp": [ "[OPTIONAL]" ],
>     "drJsVersion": [ "[OPTIONAL]" ],
>     "drJsMode": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "drJsArgument": [ "[OPTIONAL-CHECK]" ],
>     "drJsQuiet": [ "[OPTIONAL-CHECK]" ],
>   }
> ```
