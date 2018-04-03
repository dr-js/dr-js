# Specification

* [Export Path](#export-path)
* [Export Tree](#export-tree)
* [Bin Option Format](#bin-option-format)

#### Export Path
+ 📄 [source/env.js](source/env.js)
  - `assert`, `getEnvironment`, `getGlobal`, `getSystemEndianness`, `global`
+ 📄 [source/browser/DOM.js](source/browser/DOM.js)
  - `applyDragFileListListener`, `throttleByAnimationFrame`
+ 📄 [source/browser/input.js](source/browser/input.js)
  - `ENHANCED_POINTER_EVENT_TYPE`, `POINTER_EVENT_TYPE`, `applyPointerEnhancedEventListener`, `applyPointerEventListener`, `createKeyCommandListener`
+ 📄 [source/browser/net.js](source/browser/net.js)
  - `fetchLikeRequest`
+ 📄 [source/browser/resource.js](source/browser/resource.js)
  - `createDownload`, `createDownloadBlob`, `createDownloadText`, `loadImage`, `loadScript`, `loadText`
+ 📄 [source/browser/data/Blob.js](source/browser/data/Blob.js)
  - `Blob`, `parseBlobAsArrayBuffer`, `parseBlobAsDataURL`, `parseBlobAsText`
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
  - `crop`, `drawPixel`, `drawPixelLine`, `drawPixelLineList`, `floodFill`, `getPixelColor`, `replacePixelColor`, `scale`
+ 📄 [source/browser/graphic/Color.js](source/browser/graphic/Color.js)
  - `getHexFromRGB`, `getHexFromRGBA`, `getRGBAFromUint32RGBA`, `getUint32RGBA`
+ 📄 [source/browser/graphic/ImageData.js](source/browser/graphic/ImageData.js)
  - `applyCanvasElementExt`, `applyCanvasImageDataExt`, `applyImageElementExt`, `canvasElementToCanvasImageData`, `canvasImageDataToCanvasElement`, `createCanvasElement`, `createCanvasImageData`, `createImageElement`, `getQuickCanvas`, `getQuickContext2d`, `imageElementToCanvasElement`, `imageElementToCanvasImageData`
+ 📄 [source/browser/module/HistoryStateStore.js](source/browser/module/HistoryStateStore.js)
  - `createHistoryStateStore`
+ 📄 [source/common/check.js](source/common/check.js)
  - `isArrayLength`, `isBasicArray`, `isBasicFunction`, `isBasicObject`, `isInteger`, `isNumber`, `isObjectContain`, `isObjectKey`, `isOneOf`, `isString`
+ 📄 [source/common/compare.js](source/common/compare.js)
  - `compareString`, `compareStringLocale`
+ 📄 [source/common/error.js](source/common/error.js)
  - `catchAsync`, `catchSync`, `throwInfo`
+ 📄 [source/common/format.js](source/common/format.js)
  - `binary`, `describe`, `escapeHTML`, `padTable`, `stringIndentLine`, `stringListJoinCamelCase`, `time`, `unescapeHTML`
+ 📄 [source/common/function.js](source/common/function.js)
  - `createInsideOutPromise`, `debounce`, `promiseQueue`, `throttle`, `withDelayArgvQueue`, `withRepeat`, `withRetryAsync`
+ 📄 [source/common/time.js](source/common/time.js)
  - `CLOCK_PER_SECOND`, `CLOCK_TO_SECOND`, `TIMESTAMP_START`, `cancelFrameUpdate`, `clock`, `createTimer`, `getTimestamp`, `now`, `requestFrameUpdate`, `setTimeoutAsync`, `setTimeoutPromise`
+ 📄 [source/common/verify.js](source/common/verify.js)
  - `arrayLength`, `basicArray`, `basicFunction`, `basicObject`, `integer`, `number`, `objectContain`, `objectKey`, `oneOf`, `string`
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
+ 📄 [source/common/data/SetMap.js](source/common/data/SetMap.js)
  - `SetMap`
+ 📄 [source/common/data/Toggle.js](source/common/data/Toggle.js)
  - `createToggle`
+ 📄 [source/common/data/function.js](source/common/data/function.js)
  - `hashStringToNumber`, `tryParseJSONObject`
+ 📄 [source/common/geometry/Angle.js](source/common/geometry/Angle.js)
  - `DEGREE_TO_RADIAN`, `RADIAN_TO_DEGREE`, `fromDegree`, `getDegree`
+ 📄 [source/common/geometry/D2/BoundingRect.js](source/common/geometry/D2/BoundingRect.js)
  - `fromEmpty`, `fromPoint`, `fromWidget`, `fromWidgetList`, `getCenter`, `getUnion`, `isContainPoint`, `isIntersect`
+ 📄 [source/common/geometry/D2/Line.js](source/common/geometry/D2/Line.js)
  - `fromWidget`
+ 📄 [source/common/geometry/D2/Rect.js](source/common/geometry/D2/Rect.js)
  - `fromBoundingRect`, `fromEmpty`, `fromPoint`, `getCenter`, `getSize`, `getUnion`, `getUnionOfList`, `isContain`, `isContainPoint`, `isEmpty`, `isIntersect`
+ 📄 [source/common/geometry/D2/Vector.js](source/common/geometry/D2/Vector.js)
  - `abs`, `add`, `clamp`, `divide`, `fromAngleLength`, `fromOrigin`, `getAngle`, `getDist`, `getDistSq`, `getLength`, `getLengthSq`, `getRotate`, `getRotateDelta`, `max`, `min`, `multiply`, `round`, `scale`, `sub`
+ 📄 [source/common/geometry/D2/Widget.js](source/common/geometry/D2/Widget.js)
  - `fromBoundingRect`, `fromLine`, `fromPoint`, `getBoundingBottom`, `getBoundingHeight`, `getBoundingLeft`, `getBoundingRight`, `getBoundingSize`, `getBoundingTop`, `getBoundingWidth`, `isContainBoundingRect`, `isInterceptBoundingRect`, `localBoundingRect`, `localPoint`, `round`
+ 📄 [source/common/immutable/Array.js](source/common/immutable/Array.js)
  - `arrayConcat`, `arrayDelete`, `arrayFindDelete`, `arrayFindMove`, `arrayFindPush`, `arrayFindSet`, `arrayInsert`, `arrayMatchDelete`, `arrayMatchMove`, `arrayMatchPush`, `arrayMove`, `arrayPop`, `arrayPush`, `arraySet`, `arrayShift`, `arraySplitChunk`, `arrayUnshift`
+ 📄 [source/common/immutable/Object.js](source/common/immutable/Object.js)
  - `objectDelete`, `objectMerge`, `objectSet`
+ 📄 [source/common/immutable/StateStore.js](source/common/immutable/StateStore.js)
  - `createEntryEnhancer`, `createStateStore`, `createStateStoreEnhanced`, `createStateStoreLite`, `createStoreStateSyncReducer`, `reducerFromMap`, `toReduxStore`
+ 📄 [source/common/immutable/check.js](source/common/immutable/check.js)
  - `isArrayShallowEqual`, `isCompactArrayShallowEqual`, `isObjectShallowEqual`
+ 📄 [source/common/immutable/function.js](source/common/immutable/function.js)
  - `createTransformCacheWithInfo`, `transformCache`
+ 📄 [source/common/math/base.js](source/common/math/base.js)
  - `clamp`, `euclideanModulo`, `roundFloat`, `smoothstep`
+ 📄 [source/common/math/random.js](source/common/math/random.js)
  - `getRandomId`, `getRandomInt`, `getRandomIntList`
+ 📄 [source/common/module/AsyncTaskQueue.js](source/common/module/AsyncTaskQueue.js)
  - `createAsyncTaskQueue`
+ 📄 [source/common/module/Event.js](source/common/module/Event.js)
  - `createEventEmitter`, `createEventTarget`, `createHub`
+ 📄 [source/common/module/KeySelector.js](source/common/module/KeySelector.js)
  - `concatKeyFrag`, `createMultiKeySwitch`, `reduceKeySelector`
+ 📄 [source/common/module/LevenshteinDistance.js](source/common/module/LevenshteinDistance.js)
  - `getLevenshteinDistance`
+ 📄 [source/common/module/MIME.js](source/common/module/MIME.js)
  - `BASIC_EXTENSION_MAP`, `BASIC_MIME_LIST_MAP`, `DEFAULT_MIME`, `getMIMETypeFromFileName`
+ 📄 [source/common/module/RouteMap.js](source/common/module/RouteMap.js)
  - `appendRouteMap`, `createRouteMap`, `findRouteFromMap`, `getRouteParam`, `getRouteParamAny`, `parseRouteToMap`, `parseRouteUrl`
+ 📄 [source/common/module/SemVer.js](source/common/module/SemVer.js)
  - `compareSemVer`, `parseSemVer`
+ 📄 [source/common/module/TaskRunner.js](source/common/module/TaskRunner.js)
  - `createTaskRunner`, `createTaskRunnerCluster`
+ 📄 [source/common/module/UpdateLoop.js](source/common/module/UpdateLoop.js)
  - `createUpdateLoop`, `createUpdater`
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
  - `arrayActMap`, `objectActMap`
+ 📄 [source/common/module/StateSchema/function.js](source/common/module/StateSchema/function.js)
  - `SCHEMA_MARK`, `getActionReducer`, `getReducer`, `isSchemaObject`, `toStructJSONWithCheck`
+ 📄 [source/common/mutable/Object.js](source/common/mutable/Object.js)
  - `objectMergeDeep`, `objectSortKey`
+ 📄 [source/node/net.js](source/node/net.js)
  - `fetch`, `ping`, `requestAsync`, `urlToOption`
+ 📄 [source/node/resource.js](source/node/resource.js)
  - `loadJSON`, `loadLocalJSON`, `loadLocalScript`, `loadRemoteJSON`, `loadRemoteScript`, `loadScript`
+ 📄 [source/node/data/Buffer.js](source/node/data/Buffer.js)
  - `receiveBufferAsync`, `sendBufferAsync`
+ 📄 [source/node/data/BufferPacket.js](source/node/data/BufferPacket.js)
  - `MAX_BUFFER_PACKET_SIZE`, `packBufferPacket`, `parseBufferPacket`
+ 📄 [source/node/data/LogQueue.js](source/node/data/LogQueue.js)
  - `createLogQueue`
+ 📄 [source/node/data/Stream.js](source/node/data/Stream.js)
  - `pipeStreamAsync`
+ 📄 [source/node/file/Compress.js](source/node/file/Compress.js)
  - `checkBloat`, `compressFile`, `compressFileList`
+ 📄 [source/node/file/Directory.js](source/node/file/Directory.js)
  - `copyDirectoryContent`, `deleteDirectoryContent`, `getDirectoryContent`, `getDirectoryContentNameList`, `getDirectoryContentShallow`, `getFileList`, `moveDirectoryContent`, `walkDirectoryContent`, `walkDirectoryContentBottomUp`, `walkDirectoryContentShallow`
+ 📄 [source/node/file/File.js](source/node/file/File.js)
  - `FILE_TYPE`, `copyPath`, `createDirectory`, `deletePath`, `getPathType`, `movePath`
+ 📄 [source/node/file/Modify.js](source/node/file/Modify.js)
  - `copyDirectory`, `copyFile`, `deleteDirectory`, `deleteFile`, `modify`, `moveDirectory`, `moveFile`, `withTempDirectory`
+ 📄 [source/node/file/Watch.js](source/node/file/Watch.js)
  - `createFileWatcher`
+ 📄 [source/node/file/function.js](source/node/file/function.js)
  - `accessAsync`, `copyFileAsync`, `createPathPrefixLock`, `createReadStream`, `createWriteStream`, `executableAsync`, `lstatAsync`, `mkdirAsync`, `nearestExistAsync`, `readFileAsync`, `readableAsync`, `readdirAsync`, `renameAsync`, `rmdirAsync`, `statAsync`, `toPosixPath`, `trimPathDepth`, `unlinkAsync`, `visibleAsync`, `writableAsync`, `writeFileAsync`
+ 📄 [source/node/module/EntityTag.js](source/node/module/EntityTag.js)
  - `getEntityTagByContentHash`, `getEntityTagByContentHashAsync`, `getWeakEntityTagByStat`
+ 📄 [source/node/module/FactDatabase.js](source/node/module/FactDatabase.js)
  - `createFactDatabase`, `tryDeleteExtraCache`
+ 📄 [source/node/module/Logger.js](source/node/module/Logger.js)
  - `createLogger`, `createSimpleLogger`
+ 📄 [source/node/module/Option.js](source/node/module/Option.js)
  - `createOptionGetter`, `parseOptionMap`
+ 📄 [source/node/module/SafeWrite.js](source/node/module/SafeWrite.js)
  - `createSafeWriteStream`
+ 📄 [source/node/server/Server.js](source/node/server/Server.js)
  - `createRequestListener`, `createServer`, `getUnusedPort`
+ 📄 [source/node/server/Responder/Common.js](source/node/server/Responder/Common.js)
  - `AccessorMap`, `createResponderParseURL`, `createResponderReceiveBuffer`, `createStoreStateAccessor`, `responderEnd`, `responderEndWithRedirect`, `responderEndWithStatusCode`, `responderSendBuffer`, `responderSendBufferRange`, `responderSendJSON`, `responderSendStream`, `responderSendStreamRange`
+ 📄 [source/node/server/Responder/Router.js](source/node/server/Responder/Router.js)
  - `appendRouteMap`, `createResponderRouter`, `createRouteMap`, `getRouteParam`, `getRouteParamAny`
+ 📄 [source/node/server/Responder/ServeStatic.js](source/node/server/Responder/ServeStatic.js)
  - `createResponderBufferCache`, `createResponderServeStatic`
+ 📄 [source/node/server/WebSocket/Frame.js](source/node/server/WebSocket/Frame.js)
  - `FrameReceiver`, `FrameSender`
+ 📄 [source/node/server/WebSocket/WebSocketBase.js](source/node/server/WebSocket/WebSocketBase.js)
  - `WebSocketBase`
+ 📄 [source/node/server/WebSocket/WebSocketClient.js](source/node/server/WebSocket/WebSocketClient.js)
  - `WebSocketClient`, `createWebSocketClient`
+ 📄 [source/node/server/WebSocket/WebSocketServer.js](source/node/server/WebSocket/WebSocketServer.js)
  - `WebSocketServer`, `enableWebSocketServer`
+ 📄 [source/node/server/WebSocket/WebSocketUpgradeRequest.js](source/node/server/WebSocket/WebSocketUpgradeRequest.js)
  - `createUpdateRequestListener`
+ 📄 [source/node/server/WebSocket/type.js](source/node/server/WebSocket/type.js)
  - `DATA_TYPE_MAP`, `DEFAULT_FRAME_LENGTH_LIMIT`, `DO_MASK_DATA`, `DO_NOT_MASK_DATA`, `FRAME_TYPE_CONFIG_MAP`, `WEB_SOCKET_EVENT_MAP`, `WEB_SOCKET_VERSION`, `getRequestKey`, `getRespondKey`
+ 📄 [source/node/system/DefaultOpen.js](source/node/system/DefaultOpen.js)
  - `getDefaultOpen`
+ 📄 [source/node/system/NetworkAddress.js](source/node/system/NetworkAddress.js)
  - `getNetworkIPv4AddressList`
+ 📄 [source/node/system/ProcessExitListener.js](source/node/system/ProcessExitListener.js)
  - `setProcessExitListener`
+ 📄 [source/node/system/REPL.js](source/node/system/REPL.js)
  - `startREPL`
+ 📄 [source/node/system/Run.js](source/node/system/Run.js)
  - `run`, `runQuiet`, `runSync`, `withCwd`

#### Export Tree
- **Browser**
  - **Data**
    - **Blob**
      - `Blob`, `parseBlobAsArrayBuffer`, `parseBlobAsDataURL`, `parseBlobAsText`
    - **BlobPacket**
      - `MAX_BLOB_PACKET_SIZE`, `packBlobPacket`, `parseBlobPacket`
  - **Font**
    - `createFontGenerator`, `createFontGeneratorBitmap`, `createFontMapper`, `createFontRender`, `createFontRenderBitmap`
  - **Graphic**
    - **CanvasImageDataOperation**
      - `crop`, `drawPixel`, `drawPixelLine`, `drawPixelLineList`, `floodFill`, `getPixelColor`, `replacePixelColor`, `scale`
    - **Color**
      - `getHexFromRGB`, `getHexFromRGBA`, `getRGBAFromUint32RGBA`, `getUint32RGBA`
    - **ImageData**
      - `applyCanvasElementExt`, `applyCanvasImageDataExt`, `applyImageElementExt`, `canvasElementToCanvasImageData`, `canvasImageDataToCanvasElement`, `createCanvasElement`, `createCanvasImageData`, `createImageElement`, `getQuickCanvas`, `getQuickContext2d`, `imageElementToCanvasElement`, `imageElementToCanvasImageData`
  - **Module**
    - **HistoryStateStore**
      - `createHistoryStateStore`
  - **DOM**
    - `applyDragFileListListener`, `throttleByAnimationFrame`
  - **Input**
    - `ENHANCED_POINTER_EVENT_TYPE`, `POINTER_EVENT_TYPE`, `applyPointerEnhancedEventListener`, `applyPointerEventListener`, `createKeyCommandListener`
  - **Net**
    - `fetchLikeRequest`
  - **Resource**
    - `createDownload`, `createDownloadBlob`, `createDownloadText`, `loadImage`, `loadScript`, `loadText`
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
    - **SetMap**
      - `SetMap`
    - **Toggle**
      - `createToggle`
    - `hashStringToNumber`, `tryParseJSONObject`
  - **Geometry**
    - **D2**
      - **BoundingRect**
        - `fromEmpty`, `fromPoint`, `fromWidget`, `fromWidgetList`, `getCenter`, `getUnion`, `isContainPoint`, `isIntersect`
      - **Line**
        - `fromWidget`
      - **Rect**
        - `fromBoundingRect`, `fromEmpty`, `fromPoint`, `getCenter`, `getSize`, `getUnion`, `getUnionOfList`, `isContain`, `isContainPoint`, `isEmpty`, `isIntersect`
      - **Vector**
        - `abs`, `add`, `clamp`, `divide`, `fromAngleLength`, `fromOrigin`, `getAngle`, `getDist`, `getDistSq`, `getLength`, `getLengthSq`, `getRotate`, `getRotateDelta`, `max`, `min`, `multiply`, `round`, `scale`, `sub`
      - **Widget**
        - `fromBoundingRect`, `fromLine`, `fromPoint`, `getBoundingBottom`, `getBoundingHeight`, `getBoundingLeft`, `getBoundingRight`, `getBoundingSize`, `getBoundingTop`, `getBoundingWidth`, `isContainBoundingRect`, `isInterceptBoundingRect`, `localBoundingRect`, `localPoint`, `round`
    - **Angle**
      - `DEGREE_TO_RADIAN`, `RADIAN_TO_DEGREE`, `fromDegree`, `getDegree`
  - **Immutable**
    - **Array**
      - `arrayConcat`, `arrayDelete`, `arrayFindDelete`, `arrayFindMove`, `arrayFindPush`, `arrayFindSet`, `arrayInsert`, `arrayMatchDelete`, `arrayMatchMove`, `arrayMatchPush`, `arrayMove`, `arrayPop`, `arrayPush`, `arraySet`, `arrayShift`, `arraySplitChunk`, `arrayUnshift`
    - **Object**
      - `objectDelete`, `objectMerge`, `objectSet`
    - **StateStore**
      - `createEntryEnhancer`, `createStateStore`, `createStateStoreEnhanced`, `createStateStoreLite`, `createStoreStateSyncReducer`, `reducerFromMap`, `toReduxStore`
    - `isArrayShallowEqual`, `isCompactArrayShallowEqual`, `isObjectShallowEqual`, `createTransformCacheWithInfo`, `transformCache`
  - **Math**
    - `clamp`, `euclideanModulo`, `roundFloat`, `smoothstep`, `getRandomId`, `getRandomInt`, `getRandomIntList`
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
      - `arrayActMap`, `objectActMap`, `SCHEMA_MARK`, `getActionReducer`, `getReducer`, `isSchemaObject`, `toStructJSONWithCheck`
    - **AsyncTaskQueue**
      - `createAsyncTaskQueue`
    - **Event**
      - `createEventEmitter`, `createEventTarget`, `createHub`
    - **KeySelector**
      - `concatKeyFrag`, `createMultiKeySwitch`, `reduceKeySelector`
    - **LevenshteinDistance**
      - `getLevenshteinDistance`
    - **MIME**
      - `BASIC_EXTENSION_MAP`, `BASIC_MIME_LIST_MAP`, `DEFAULT_MIME`, `getMIMETypeFromFileName`
    - **RouteMap**
      - `appendRouteMap`, `createRouteMap`, `findRouteFromMap`, `getRouteParam`, `getRouteParamAny`, `parseRouteToMap`, `parseRouteUrl`
    - **SemVer**
      - `compareSemVer`, `parseSemVer`
    - **TaskRunner**
      - `createTaskRunner`, `createTaskRunnerCluster`
    - **UpdateLoop**
      - `createUpdateLoop`, `createUpdater`
  - **Mutable**
    - **Object**
      - `objectMergeDeep`, `objectSortKey`
  - **Check**
    - `isArrayLength`, `isBasicArray`, `isBasicFunction`, `isBasicObject`, `isInteger`, `isNumber`, `isObjectContain`, `isObjectKey`, `isOneOf`, `isString`
  - **Compare**
    - `compareString`, `compareStringLocale`
  - **Error**
    - `catchAsync`, `catchSync`, `throwInfo`
  - **Format**
    - `binary`, `describe`, `escapeHTML`, `padTable`, `stringIndentLine`, `stringListJoinCamelCase`, `time`, `unescapeHTML`
  - **Function**
    - `createInsideOutPromise`, `debounce`, `promiseQueue`, `throttle`, `withDelayArgvQueue`, `withRepeat`, `withRetryAsync`
  - **Time**
    - `CLOCK_PER_SECOND`, `CLOCK_TO_SECOND`, `TIMESTAMP_START`, `cancelFrameUpdate`, `clock`, `createTimer`, `getTimestamp`, `now`, `requestFrameUpdate`, `setTimeoutAsync`, `setTimeoutPromise`
  - **Verify**
    - `arrayLength`, `basicArray`, `basicFunction`, `basicObject`, `integer`, `number`, `objectContain`, `objectKey`, `oneOf`, `string`
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
      - `checkBloat`, `compressFile`, `compressFileList`
    - **Directory**
      - `copyDirectoryContent`, `deleteDirectoryContent`, `getDirectoryContent`, `getDirectoryContentNameList`, `getDirectoryContentShallow`, `getFileList`, `moveDirectoryContent`, `walkDirectoryContent`, `walkDirectoryContentBottomUp`, `walkDirectoryContentShallow`
    - **File**
      - `FILE_TYPE`, `copyPath`, `createDirectory`, `deletePath`, `getPathType`, `movePath`
    - **Modify**
      - `copyDirectory`, `copyFile`, `deleteDirectory`, `deleteFile`, `modify`, `moveDirectory`, `moveFile`, `withTempDirectory`
    - **Watch**
      - `createFileWatcher`
    - `accessAsync`, `copyFileAsync`, `createPathPrefixLock`, `createReadStream`, `createWriteStream`, `executableAsync`, `lstatAsync`, `mkdirAsync`, `nearestExistAsync`, `readFileAsync`, `readableAsync`, `readdirAsync`, `renameAsync`, `rmdirAsync`, `statAsync`, `toPosixPath`, `trimPathDepth`, `unlinkAsync`, `visibleAsync`, `writableAsync`, `writeFileAsync`
  - **Module**
    - **EntityTag**
      - `getEntityTagByContentHash`, `getEntityTagByContentHashAsync`, `getWeakEntityTagByStat`
    - **FactDatabase**
      - `createFactDatabase`, `tryDeleteExtraCache`
    - **Logger**
      - `createLogger`, `createSimpleLogger`
    - **Option**
      - `createOptionGetter`, `parseOptionMap`
    - **SafeWrite**
      - `createSafeWriteStream`
  - **Server**
    - **Responder**
      - **Common**
        - `AccessorMap`, `createResponderParseURL`, `createResponderReceiveBuffer`, `createStoreStateAccessor`, `responderEnd`, `responderEndWithRedirect`, `responderEndWithStatusCode`, `responderSendBuffer`, `responderSendBufferRange`, `responderSendJSON`, `responderSendStream`, `responderSendStreamRange`
      - **Router**
        - `appendRouteMap`, `createResponderRouter`, `createRouteMap`, `getRouteParam`, `getRouteParamAny`
      - **ServeStatic**
        - `createResponderBufferCache`, `createResponderServeStatic`
    - **WebSocket**
      - **Frame**
        - `FrameReceiver`, `FrameSender`
      - **WebSocketBase**
        - `WebSocketBase`
      - **WebSocketClient**
        - `WebSocketClient`, `createWebSocketClient`
      - **WebSocketServer**
        - `WebSocketServer`, `enableWebSocketServer`
      - **WebSocketUpgradeRequest**
        - `createUpdateRequestListener`
      - `DATA_TYPE_MAP`, `DEFAULT_FRAME_LENGTH_LIMIT`, `DO_MASK_DATA`, `DO_NOT_MASK_DATA`, `FRAME_TYPE_CONFIG_MAP`, `WEB_SOCKET_EVENT_MAP`, `WEB_SOCKET_VERSION`, `getRequestKey`, `getRespondKey`
    - **Server**
      - `createRequestListener`, `createServer`, `getUnusedPort`
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
      - `run`, `runQuiet`, `runSync`, `withCwd`
  - **Net**
    - `fetch`, `ping`, `requestAsync`, `urlToOption`
  - **Resource**
    - `loadJSON`, `loadLocalJSON`, `loadLocalScript`, `loadRemoteJSON`, `loadRemoteScript`, `loadScript`
- **Env**
  - `assert`, `getEnvironment`, `getGlobal`, `getSystemEndianness`, `global`

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
