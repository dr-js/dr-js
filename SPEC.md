# Specification

* [Export Path](#export-path)
* [Export Tree](#export-tree)
* [Bin Option Format](#bin-option-format)

#### Export Path
+ 📄 [source/browser/DOM.js](source/browser/DOM.js)
  - `applyReceiveFileListListener`, `getElementAtViewport`, `getPathElementList`, `throttleByAnimationFrame`
+ 📄 [source/browser/net.js](source/browser/net.js)
  - `fetchLikeRequest`
+ 📄 [source/browser/resource.js](source/browser/resource.js)
  - `createDownload`, `createDownloadWithBlob`, `createDownloadWithObject`, `createDownloadWithString`, `deleteArrayBufferCache`, `loadArrayBufferCache`, `loadImage`, `loadScript`, `loadText`, `saveArrayBufferCache`
+ 📄 [source/browser/data/Blob.js](source/browser/data/Blob.js)
  - `Blob`, `parseBlobAsArrayBuffer`, `parseBlobAsDataURL`, `parseBlobAsText`
+ 📄 [source/browser/data/BlobPacket.js](source/browser/data/BlobPacket.js)
  - `packBlobPacket`, `parseBlobPacket`
+ 📄 [source/browser/input/KeyCommand.js](source/browser/input/KeyCommand.js)
  - `createKeyCommandHub`
+ 📄 [source/browser/input/PointerEvent.js](source/browser/input/PointerEvent.js)
  - `ENHANCED_POINTER_EVENT_TYPE`, `POINTER_EVENT_TYPE`, `applyEnhancedPointerEventListener`, `applyPointerEventListener`
+ 📄 [source/browser/module/HistoryStateStore.js](source/browser/module/HistoryStateStore.js)
  - `createHistoryStateStore`
+ 📄 [source/browser/module/StateStorage.js](source/browser/module/StateStorage.js)
  - `createSyncStateStorage`
+ 📄 [source/common/check.js](source/common/check.js)
  - `isArrayLength`, `isBasicArray`, `isBasicFunction`, `isBasicObject`, `isBoolean`, `isFunctionThrow`, `isFunctionThrowAsync`, `isInteger`, `isNumber`, `isObjectAlike`, `isObjectContain`, `isObjectKey`, `isOneOf`, `isPromiseAlike`, `isRegExp`, `isStrictEqual`, `isString`, `isStringifyEqual`
+ 📄 [source/common/compare.js](source/common/compare.js)
  - `compareString`, `compareStringLocale`, `compareStringWithNumber`
+ 📄 [source/common/error.js](source/common/error.js)
  - `catchAsync`, `catchSync`, `rethrowError`, `tryCall`
+ 📄 [source/common/format.js](source/common/format.js)
  - `binary`, `decimal`, `describe`, `mediaTime`, `padTable`, `percent`, `prettyStringifyJSON`, `time`
+ 📄 [source/common/function.js](source/common/function.js)
  - `createInsideOutPromise`, `debounce`, `lossyAsync`, `throttle`, `withDelayArgvQueue`, `withRepeat`, `withRepeatAsync`, `withRetry`, `withRetryAsync`, `withTimeoutAsync`, `withTimeoutPromise`
+ 📄 [source/common/string.js](source/common/string.js)
  - `autoEllipsis`, `createMarkReplacer`, `escapeHTML`, `escapeRegExp`, `indentLine`, `indentList`, `joinCamelCase`, `joinKebabCase`, `joinSnakeCase`, `removeInvalidCharXML`, `splitCamelCase`, `splitKebabCase`, `splitSnakeCase`, `unescapeHTML`
+ 📄 [source/common/time.js](source/common/time.js)
  - `CLOCK_PER_SECOND`, `CLOCK_TO_SECOND`, `cancelFrameUpdate`, `clock`, `createStepper`, `createTimer`, `getTimestamp`, `requestFrameUpdate`, `setTimeoutAsync`
+ 📄 [source/common/verify.js](source/common/verify.js)
  - `arrayLength`, `basicArray`, `basicFunction`, `basicObject`, `boolean`, `doNotThrow`, `doNotThrowAsync`, `doThrow`, `doThrowAsync`, `integer`, `notStrictEqual`, `notStringifyEqual`, `number`, `objectAlike`, `objectContain`, `objectKey`, `oneOf`, `promiseAlike`, `regexp`, `strictEqual`, `string`, `stringifyEqual`
+ 📄 [source/common/data/ArrayBuffer.js](source/common/data/ArrayBuffer.js)
  - `concatArrayBuffer`, `deconcatArrayBuffer`, `fromString`, `isEqualArrayBuffer`, `toString`
+ 📄 [source/common/data/ArrayBufferPacket.js](source/common/data/ArrayBufferPacket.js)
  - `HEADER_BYTE_SIZE`, `MAX_PACKET_HEADER_SIZE`, `packArrayBufferHeader`, `packArrayBufferPacket`, `packChainArrayBufferPacket`, `parseArrayBufferHeader`, `parseArrayBufferPacket`, `parseChainArrayBufferPacket`
+ 📄 [source/common/data/Base64.js](source/common/data/Base64.js)
  - `decode`, `encode`
+ 📄 [source/common/data/CacheMap.js](source/common/data/CacheMap.js)
  - `createCache`, `createCacheMap`
+ 📄 [source/common/data/DataUri.js](source/common/data/DataUri.js)
  - `decode`, `encode`
+ 📄 [source/common/data/LinkedList.js](source/common/data/LinkedList.js)
  - `createDoublyLinkedList`, `createNode`
+ 📄 [source/common/data/ListMap.js](source/common/data/ListMap.js)
  - `createListMap`
+ 📄 [source/common/data/SaveQueue.js](source/common/data/SaveQueue.js)
  - `createSaveQueue`
+ 📄 [source/common/data/SetMap.js](source/common/data/SetMap.js)
  - `createSetMap`, `getInvertSetMap`
+ 📄 [source/common/data/Toggle.js](source/common/data/Toggle.js)
  - `createToggle`
+ 📄 [source/common/data/Tree.js](source/common/data/Tree.js)
  - `createTreeBottomUpSearch`, `createTreeBottomUpSearchAsync`, `createTreeBreadthFirstSearch`, `createTreeBreadthFirstSearchAsync`, `createTreeDepthFirstSearch`, `createTreeDepthFirstSearchAsync`, `prettyStringifyTree`
+ 📄 [source/common/data/function.js](source/common/data/function.js)
  - `getValueByKeyList`, `hashStringToNumber`, `reverseString`, `swapObfuscateString`, `tryParseJSONObject`
+ 📄 [source/common/geometry/Angle.js](source/common/geometry/Angle.js)
  - `DEGREE_TO_RADIAN`, `RADIAN_TO_DEGREE`, `fromDegree`, `getDegree`
+ 📄 [source/common/geometry/D2/BoundingRect.js](source/common/geometry/D2/BoundingRect.js)
  - `fromEmpty`, `fromPoint`, `fromWidget`, `fromWidgetList`, `getCenter`, `getUnion`, `isContainPoint`, `isIntersect`
+ 📄 [source/common/geometry/D2/Line.js](source/common/geometry/D2/Line.js)
  - `fromWidget`
+ 📄 [source/common/geometry/D2/Rect.js](source/common/geometry/D2/Rect.js)
  - `fromBoundingRect`, `fromEmpty`, `fromPoint`, `getCenter`, `getSize`, `getUnion`, `getUnionOfList`, `isContain`, `isContainPoint`, `isEmpty`, `isIntersect`
+ 📄 [source/common/geometry/D2/Vector.js](source/common/geometry/D2/Vector.js)
  - `abs`, `add`, `clamp`, `divide`, `fromAngleLength`, `fromOrigin`, `getAngle`, `getDist`, `getDistSq`, `getDotProduct`, `getLength`, `getLengthSq`, `getRotate`, `getRotateDelta`, `isZero`, `lerp`, `max`, `min`, `multiply`, `project`, `round`, `scale`, `sub`
+ 📄 [source/common/geometry/D2/Widget.js](source/common/geometry/D2/Widget.js)
  - `fromBoundingRect`, `fromLine`, `fromPoint`, `getBoundingBottom`, `getBoundingHeight`, `getBoundingLeft`, `getBoundingRight`, `getBoundingSize`, `getBoundingTop`, `getBoundingWidth`, `isContainBoundingRect`, `isInterceptBoundingRect`, `localBoundingRect`, `localPoint`, `round`
+ 📄 [source/common/immutable/Array.js](source/common/immutable/Array.js)
  - `arrayConcat`, `arrayDelete`, `arrayFindDelete`, `arrayFindMove`, `arrayFindOrPush`, `arrayFindSet`, `arrayFindSetOrPush`, `arrayInsert`, `arrayMatchDelete`, `arrayMatchMove`, `arrayMatchPush`, `arrayMove`, `arrayPop`, `arrayPush`, `arraySet`, `arrayShift`, `arraySplitChunk`, `arrayUnshift`
+ 📄 [source/common/immutable/Object.js](source/common/immutable/Object.js)
  - `objectDelete`, `objectFilter`, `objectFindKey`, `objectFromEntries`, `objectMap`, `objectMerge`, `objectPickKey`, `objectSet`
+ 📄 [source/common/immutable/StateStore.js](source/common/immutable/StateStore.js)
  - `createEntryEnhancer`, `createStateStore`, `createStateStoreEnhanced`, `createStateStoreLite`, `createStoreStateSyncReducer`, `reducerFromMap`, `toReduxStore`
+ 📄 [source/common/immutable/check.js](source/common/immutable/check.js)
  - `isArrayShallowEqual`, `isCompactArrayShallowEqual`, `isObjectShallowEqual`
+ 📄 [source/common/immutable/function.js](source/common/immutable/function.js)
  - `transformCache`
+ 📄 [source/common/math/base.js](source/common/math/base.js)
  - `addAbs`, `clamp`, `euclideanModulo`, `lerp`, `roundFloat`, `smoothstep`
+ 📄 [source/common/math/easing.js](source/common/math/easing.js)
  - `easeInCirc`, `easeInCubic`, `easeInExpo`, `easeInOutCirc`, `easeInOutCubic`, `easeInOutExpo`, `easeInOutQuad`, `easeInOutQuart`, `easeInOutQuint`, `easeInOutSine`, `easeInQuad`, `easeInQuart`, `easeInQuint`, `easeInSine`, `easeOutCirc`, `easeOutCubic`, `easeOutExpo`, `easeOutQuad`, `easeOutQuart`, `easeOutQuint`, `easeOutSine`, `linear`
+ 📄 [source/common/math/random.js](source/common/math/random.js)
  - `getRandomArrayBuffer`, `getRandomId`, `getRandomInt`, `getRandomIntList`
+ 📄 [source/common/math/sample.js](source/common/math/sample.js)
  - `getSample`, `getSampleRange`, `getSampleRate`
+ 📄 [source/common/module/AsyncTaskLane.js](source/common/module/AsyncTaskLane.js)
  - `createAsyncTaskLane`, `selectMinLoadLane`
+ 📄 [source/common/module/AsyncTaskQueue.js](source/common/module/AsyncTaskQueue.js)
  - `createAsyncTaskQueue`
+ 📄 [source/common/module/AsyncTaskRunner.js](source/common/module/AsyncTaskRunner.js)
  - `createAsyncTaskRunner`, `createAsyncTaskRunnerCluster`, `selectMinLoadRunner`
+ 📄 [source/common/module/BlockChart.js](source/common/module/BlockChart.js)
  - `getBlockBar`, `getBlockChart`
+ 📄 [source/common/module/Event.js](source/common/module/Event.js)
  - `createEventEmitter`, `createEventTarget`, `createHub`
+ 📄 [source/common/module/KeySelector.js](source/common/module/KeySelector.js)
  - `concatKeyFrag`, `createMultiKeySwitch`, `reduceKeySelector`
+ 📄 [source/common/module/KeyTree.js](source/common/module/KeyTree.js)
  - `createKeyTree`, `createKeyTreeEnhanced`
+ 📄 [source/common/module/LevenshteinDistance.js](source/common/module/LevenshteinDistance.js)
  - `getLevenshteinDistance`
+ 📄 [source/common/module/MIME.js](source/common/module/MIME.js)
  - `BASIC_EXTENSION_MAP`, `DEFAULT_MIME`, `getMIMETypeFromFileName`
+ 📄 [source/common/module/Patch.js](source/common/module/Patch.js)
  - `createPatchKit`, `toArrayWithKeyPatchKit`, `toObjectPatchKit`
+ 📄 [source/common/module/RouteMap.js](source/common/module/RouteMap.js)
  - `appendRouteMap`, `createRouteMap`, `findRouteFromMap`, `getRouteParam`, `getRouteParamAny`, `parseRouteToMap`, `parseRouteUrl`
+ 📄 [source/common/module/SemVer.js](source/common/module/SemVer.js)
  - `compareSemVer`, `parseSemVer`
+ 📄 [source/common/module/TimedLookup.js](source/common/module/TimedLookup.js)
  - `generateCheckCode`, `generateLookupData`, `packCheckCode`, `packDataArrayBuffer`, `parseCheckCode`, `parseDataArrayBuffer`, `verifyCheckCode`, `verifyOption`, `verifyParsedCheckCode`
+ 📄 [source/common/module/UpdateLoop.js](source/common/module/UpdateLoop.js)
  - `createUpdateLoop`, `createUpdater`
+ 📄 [source/common/mutable/Object.js](source/common/mutable/Object.js)
  - `objectMergeDeep`, `objectSortKey`
+ 📄 [source/env/function.js](source/env/function.js)
  - `assert`, `getEndianness`
+ 📄 [source/env/global.js](source/env/global.js)
  - `getEnvironment`, `getGlobal`, `global`
+ 📄 [source/env/tryRequire.js](source/env/tryRequire.js)
  - `tryRequire`, `tryRequireResolve`
+ 📄 [source/node/net.js](source/node/net.js)
  - `fetchLikeRequest`, `fetchWithJump`, `ping`, `requestHttp`
+ 📄 [source/node/resource.js](source/node/resource.js)
  - `DR_BROWSER_FILE_PATH`, `DR_BROWSER_SCRIPT_TAG`, `loadJSON`, `loadLocalJSON`, `loadLocalScript`, `loadRemoteJSON`, `loadRemoteScript`, `loadScript`
+ 📄 [source/node/data/Buffer.js](source/node/data/Buffer.js)
  - `toArrayBuffer`
+ 📄 [source/node/data/BufferPacket.js](source/node/data/BufferPacket.js)
  - `packBufferPacket`, `parseBufferPacket`
+ 📄 [source/node/data/LogQueue.js](source/node/data/LogQueue.js)
  - `createLogQueue`
+ 📄 [source/node/data/Stream.js](source/node/data/Stream.js)
  - `bufferToReadableStream`, `readableStreamToBufferAsync`, `readlineOfStreamAsync`, `setupStreamPipe`, `waitStreamStopAsync`, `writeBufferToStreamAsync`
+ 📄 [source/node/data/function.js](source/node/data/function.js)
  - `getRandomBufferAsync`
+ 📄 [source/node/file/Directory.js](source/node/file/Directory.js)
  - `copyDirectory`, `copyDirectoryInfoTree`, `createDirectory`, `deleteDirectory`, `deleteDirectoryInfoTree`, `getDirectoryInfoTree`, `getDirectorySubInfoList`, `getFileList`, `renameDirectoryInfoTree`, `walkDirectoryInfoTree`, `walkDirectoryInfoTreeBottomUp`
+ 📄 [source/node/file/Modify.js](source/node/file/Modify.js)
  - `modifyCopy`, `modifyDelete`, `modifyDeleteForce`, `modifyRename`
+ 📄 [source/node/file/Path.js](source/node/file/Path.js)
  - `PATH_TYPE`, `STAT_ERROR`, `copyPath`, `createPathPrefixLock`, `deletePath`, `getPathStat`, `getPathTypeFromStat`, `nearestExistPath`, `renamePath`, `toPosixPath`
+ 📄 [source/node/file/Watch.js](source/node/file/Watch.js)
  - `createFileWatcher`
+ 📄 [source/node/file/function.js](source/node/file/function.js)
  - `appendFileAsync`, `closeAsync`, `copyFileAsync`, `createReadStream`, `createWriteStream`, `executableAsync`, `mkdirAsync`, `openAsync`, `readAsync`, `readFileAsync`, `readableAsync`, `readdirAsync`, `readlinkAsync`, `renameAsync`, `rmdirAsync`, `statAsync`, `symlinkAsync`, `truncateAsync`, `unlinkAsync`, `visibleAsync`, `writableAsync`, `writeAsync`, `writeFileAsync`
+ 📄 [source/node/module/EntityTag.js](source/node/module/EntityTag.js)
  - `getEntityTagByContentHash`, `getEntityTagByContentHashAsync`, `getWeakEntityTagByStat`
+ 📄 [source/node/module/Logger.js](source/node/module/Logger.js)
  - `createLogger`, `createSimpleLogger`
+ 📄 [source/node/module/SafeWrite.js](source/node/module/SafeWrite.js)
  - `createSafeWriteStream`
+ 📄 [source/node/module/Option/parser.js](source/node/module/Option/parser.js)
  - `createOptionParser`
+ 📄 [source/node/module/Option/preset.js](source/node/module/Option/preset.js)
  - `Preset`, `createOptionGetter`, `getOptionalFormatFlag`, `getOptionalFormatValue`, `parseOptionMap`, `prepareOption`
+ 📄 [source/node/server/Proxy.js](source/node/server/Proxy.js)
  - `createTCPProxyListener`
+ 📄 [source/node/server/Server.js](source/node/server/Server.js)
  - `createRequestListener`, `createServerPack`, `describeServerPack`
+ 📄 [source/node/server/commonHTML.js](source/node/server/commonHTML.js)
  - `COMMON_FUNC_MAP`, `COMMON_LAYOUT`, `COMMON_SCRIPT`, `COMMON_STYLE`
+ 📄 [source/node/server/function.js](source/node/server/function.js)
  - `autoTestServerPort`, `getUnusedPort`, `parseCookieString`
+ 📄 [source/node/server/Responder/Common.js](source/node/server/Responder/Common.js)
  - `createResponderHostMapper`, `createResponderLog`, `createResponderLogEnd`, `createResponderSetHeaderHSTS`, `responderEnd`, `responderEndWithRedirect`, `responderEndWithStatusCode`, `responderSetHeaderCacheControlImmutable`
+ 📄 [source/node/server/Responder/RateLimit.js](source/node/server/Responder/RateLimit.js)
  - `createResponderCheckRateLimit`, `createResponderRateLimit`
+ 📄 [source/node/server/Responder/Router.js](source/node/server/Responder/Router.js)
  - `METHOD_MAP`, `appendRouteMap`, `createResponderRouteListHTML`, `createResponderRouter`, `createRouteMap`, `describeRouteMap`, `getRouteParam`, `getRouteParamAny`
+ 📄 [source/node/server/Responder/Send.js](source/node/server/Responder/Send.js)
  - `createResponderFavicon`, `prepareBufferData`, `prepareBufferDataAsync`, `responderSendBuffer`, `responderSendBufferCompress`, `responderSendBufferRange`, `responderSendJSON`, `responderSendStream`, `responderSendStreamCompress`, `responderSendStreamRange`
+ 📄 [source/node/server/Responder/ServeStatic.js](source/node/server/Responder/ServeStatic.js)
  - `createDefaultCacheMap`, `createResponderBufferCache`, `createResponderServeStatic`
+ 📄 [source/node/server/WebSocket/WebSocket.js](source/node/server/WebSocket/WebSocket.js)
  - `createWebSocket`
+ 📄 [source/node/server/WebSocket/WebSocketClient.js](source/node/server/WebSocket/WebSocketClient.js)
  - `createWebSocketClient`
+ 📄 [source/node/server/WebSocket/WebSocketServer.js](source/node/server/WebSocket/WebSocketServer.js)
  - `enableWebSocketServer`
+ 📄 [source/node/server/WebSocket/WebSocketUpgradeRequest.js](source/node/server/WebSocket/WebSocketUpgradeRequest.js)
  - `createUpdateRequestListener`
+ 📄 [source/node/server/WebSocket/frameReceiver.js](source/node/server/WebSocket/frameReceiver.js)
  - `createFrameReceiverStore`, `listenAndReceiveFrame`
+ 📄 [source/node/server/WebSocket/frameSender.js](source/node/server/WebSocket/frameSender.js)
  - `createFrameSenderStore`, `encodeCloseFrame`, `encodeFrame`, `encodePingFrame`, `encodePongFrame`, `sendEncodedFrame`
+ 📄 [source/node/server/WebSocket/function.js](source/node/server/WebSocket/function.js)
  - `BUFFER_MAX_LENGTH`, `FRAME_CONFIG`, `OPCODE_TYPE`, `WEBSOCKET_EVENT`, `WEBSOCKET_VERSION`, `applyMaskQuadletBufferInPlace`, `getRequestKey`, `getRespondKey`
+ 📄 [source/node/system/DefaultOpen.js](source/node/system/DefaultOpen.js)
  - `getDefaultOpen`
+ 📄 [source/node/system/ExitListener.js](source/node/system/ExitListener.js)
  - `addExitListenerAsync`, `addExitListenerSync`, `clearExitListener`, `deleteExitListenerAsync`, `deleteExitListenerSync`
+ 📄 [source/node/system/Process.js](source/node/system/Process.js)
  - `describeAllProcessStatusAsync`, `findProcessPidMapInfo`, `findProcessTreeInfo`, `getAllProcessStatusAsync`, `getProcessListAsync`, `isPidExist`, `killProcessInfoAsync`, `killProcessTreeInfoAsync`, `sortProcessList`, `toProcessPidMap`, `toProcessTree`
+ 📄 [source/node/system/Run.js](source/node/system/Run.js)
  - `run`, `runSync`, `withCwd`
+ 📄 [source/node/system/Status.js](source/node/system/Status.js)
  - `describeSystemActivity`, `describeSystemMemory`, `describeSystemNetwork`, `describeSystemPlatform`, `describeSystemProcessor`, `describeSystemStatus`, `getSystemActivity`, `getSystemMemory`, `getSystemNetwork`, `getSystemPlatform`, `getSystemProcessor`, `getSystemStatus`

#### Export Tree
- **Browser**
  - **Data**
    - **Blob**
      - `Blob`, `parseBlobAsArrayBuffer`, `parseBlobAsDataURL`, `parseBlobAsText`
    - **BlobPacket**
      - `packBlobPacket`, `parseBlobPacket`
  - **Input**
    - **KeyCommand**
      - `createKeyCommandHub`
    - **PointerEvent**
      - `ENHANCED_POINTER_EVENT_TYPE`, `POINTER_EVENT_TYPE`, `applyEnhancedPointerEventListener`, `applyPointerEventListener`
  - **Module**
    - **HistoryStateStore**
      - `createHistoryStateStore`
    - **StateStorage**
      - `createSyncStateStorage`
  - **DOM**
    - `applyReceiveFileListListener`, `getElementAtViewport`, `getPathElementList`, `throttleByAnimationFrame`
  - **Net**
    - `fetchLikeRequest`
  - **Resource**
    - `createDownload`, `createDownloadWithBlob`, `createDownloadWithObject`, `createDownloadWithString`, `deleteArrayBufferCache`, `loadArrayBufferCache`, `loadImage`, `loadScript`, `loadText`, `saveArrayBufferCache`
- **Common**
  - **Data**
    - **ArrayBuffer**
      - `concatArrayBuffer`, `deconcatArrayBuffer`, `fromString`, `isEqualArrayBuffer`, `toString`
    - **ArrayBufferPacket**
      - `HEADER_BYTE_SIZE`, `MAX_PACKET_HEADER_SIZE`, `packArrayBufferHeader`, `packArrayBufferPacket`, `packChainArrayBufferPacket`, `parseArrayBufferHeader`, `parseArrayBufferPacket`, `parseChainArrayBufferPacket`
    - **Base64**
      - `decode`, `encode`
    - **CacheMap**
      - `createCache`, `createCacheMap`
    - **DataUri**
      - `decode`, `encode`
    - **LinkedList**
      - `createDoublyLinkedList`, `createNode`
    - **ListMap**
      - `createListMap`
    - **SaveQueue**
      - `createSaveQueue`
    - **SetMap**
      - `createSetMap`, `getInvertSetMap`
    - **Toggle**
      - `createToggle`
    - **Tree**
      - `createTreeBottomUpSearch`, `createTreeBottomUpSearchAsync`, `createTreeBreadthFirstSearch`, `createTreeBreadthFirstSearchAsync`, `createTreeDepthFirstSearch`, `createTreeDepthFirstSearchAsync`, `prettyStringifyTree`
    - `getValueByKeyList`, `hashStringToNumber`, `reverseString`, `swapObfuscateString`, `tryParseJSONObject`
  - **Geometry**
    - **D2**
      - **BoundingRect**
        - `fromEmpty`, `fromPoint`, `fromWidget`, `fromWidgetList`, `getCenter`, `getUnion`, `isContainPoint`, `isIntersect`
      - **Line**
        - `fromWidget`
      - **Rect**
        - `fromBoundingRect`, `fromEmpty`, `fromPoint`, `getCenter`, `getSize`, `getUnion`, `getUnionOfList`, `isContain`, `isContainPoint`, `isEmpty`, `isIntersect`
      - **Vector**
        - `abs`, `add`, `clamp`, `divide`, `fromAngleLength`, `fromOrigin`, `getAngle`, `getDist`, `getDistSq`, `getDotProduct`, `getLength`, `getLengthSq`, `getRotate`, `getRotateDelta`, `isZero`, `lerp`, `max`, `min`, `multiply`, `project`, `round`, `scale`, `sub`
      - **Widget**
        - `fromBoundingRect`, `fromLine`, `fromPoint`, `getBoundingBottom`, `getBoundingHeight`, `getBoundingLeft`, `getBoundingRight`, `getBoundingSize`, `getBoundingTop`, `getBoundingWidth`, `isContainBoundingRect`, `isInterceptBoundingRect`, `localBoundingRect`, `localPoint`, `round`
    - **Angle**
      - `DEGREE_TO_RADIAN`, `RADIAN_TO_DEGREE`, `fromDegree`, `getDegree`
  - **Immutable**
    - **Array**
      - `arrayConcat`, `arrayDelete`, `arrayFindDelete`, `arrayFindMove`, `arrayFindOrPush`, `arrayFindSet`, `arrayFindSetOrPush`, `arrayInsert`, `arrayMatchDelete`, `arrayMatchMove`, `arrayMatchPush`, `arrayMove`, `arrayPop`, `arrayPush`, `arraySet`, `arrayShift`, `arraySplitChunk`, `arrayUnshift`
    - **Object**
      - `objectDelete`, `objectFilter`, `objectFindKey`, `objectFromEntries`, `objectMap`, `objectMerge`, `objectPickKey`, `objectSet`
    - **StateStore**
      - `createEntryEnhancer`, `createStateStore`, `createStateStoreEnhanced`, `createStateStoreLite`, `createStoreStateSyncReducer`, `reducerFromMap`, `toReduxStore`
    - `isArrayShallowEqual`, `isCompactArrayShallowEqual`, `isObjectShallowEqual`, `transformCache`
  - **Math**
    - `addAbs`, `clamp`, `euclideanModulo`, `lerp`, `roundFloat`, `smoothstep`, `easeInCirc`, `easeInCubic`, `easeInExpo`, `easeInOutCirc`, `easeInOutCubic`, `easeInOutExpo`, `easeInOutQuad`, `easeInOutQuart`, `easeInOutQuint`, `easeInOutSine`, `easeInQuad`, `easeInQuart`, `easeInQuint`, `easeInSine`, `easeOutCirc`, `easeOutCubic`, `easeOutExpo`, `easeOutQuad`, `easeOutQuart`, `easeOutQuint`, `easeOutSine`, `linear`, `getRandomArrayBuffer`, `getRandomId`, `getRandomInt`, `getRandomIntList`, `getSample`, `getSampleRange`, `getSampleRate`
  - **Module**
    - **AsyncTaskLane**
      - `createAsyncTaskLane`, `selectMinLoadLane`
    - **AsyncTaskQueue**
      - `createAsyncTaskQueue`
    - **AsyncTaskRunner**
      - `createAsyncTaskRunner`, `createAsyncTaskRunnerCluster`, `selectMinLoadRunner`
    - **BlockChart**
      - `getBlockBar`, `getBlockChart`
    - **Event**
      - `createEventEmitter`, `createEventTarget`, `createHub`
    - **KeySelector**
      - `concatKeyFrag`, `createMultiKeySwitch`, `reduceKeySelector`
    - **KeyTree**
      - `createKeyTree`, `createKeyTreeEnhanced`
    - **LevenshteinDistance**
      - `getLevenshteinDistance`
    - **MIME**
      - `BASIC_EXTENSION_MAP`, `DEFAULT_MIME`, `getMIMETypeFromFileName`
    - **Patch**
      - `createPatchKit`, `toArrayWithKeyPatchKit`, `toObjectPatchKit`
    - **RouteMap**
      - `appendRouteMap`, `createRouteMap`, `findRouteFromMap`, `getRouteParam`, `getRouteParamAny`, `parseRouteToMap`, `parseRouteUrl`
    - **SemVer**
      - `compareSemVer`, `parseSemVer`
    - **TimedLookup**
      - `generateCheckCode`, `generateLookupData`, `packCheckCode`, `packDataArrayBuffer`, `parseCheckCode`, `parseDataArrayBuffer`, `verifyCheckCode`, `verifyOption`, `verifyParsedCheckCode`
    - **UpdateLoop**
      - `createUpdateLoop`, `createUpdater`
  - **Mutable**
    - **Object**
      - `objectMergeDeep`, `objectSortKey`
  - **Check**
    - `isArrayLength`, `isBasicArray`, `isBasicFunction`, `isBasicObject`, `isBoolean`, `isFunctionThrow`, `isFunctionThrowAsync`, `isInteger`, `isNumber`, `isObjectAlike`, `isObjectContain`, `isObjectKey`, `isOneOf`, `isPromiseAlike`, `isRegExp`, `isStrictEqual`, `isString`, `isStringifyEqual`
  - **Compare**
    - `compareString`, `compareStringLocale`, `compareStringWithNumber`
  - **Error**
    - `catchAsync`, `catchSync`, `rethrowError`, `tryCall`
  - **Format**
    - `binary`, `decimal`, `describe`, `mediaTime`, `padTable`, `percent`, `prettyStringifyJSON`, `time`
  - **Function**
    - `createInsideOutPromise`, `debounce`, `lossyAsync`, `throttle`, `withDelayArgvQueue`, `withRepeat`, `withRepeatAsync`, `withRetry`, `withRetryAsync`, `withTimeoutAsync`, `withTimeoutPromise`
  - **String**
    - `autoEllipsis`, `createMarkReplacer`, `escapeHTML`, `escapeRegExp`, `indentLine`, `indentList`, `joinCamelCase`, `joinKebabCase`, `joinSnakeCase`, `removeInvalidCharXML`, `splitCamelCase`, `splitKebabCase`, `splitSnakeCase`, `unescapeHTML`
  - **Time**
    - `CLOCK_PER_SECOND`, `CLOCK_TO_SECOND`, `cancelFrameUpdate`, `clock`, `createStepper`, `createTimer`, `getTimestamp`, `requestFrameUpdate`, `setTimeoutAsync`
  - **Verify**
    - `arrayLength`, `basicArray`, `basicFunction`, `basicObject`, `boolean`, `doNotThrow`, `doNotThrowAsync`, `doThrow`, `doThrowAsync`, `integer`, `notStrictEqual`, `notStringifyEqual`, `number`, `objectAlike`, `objectContain`, `objectKey`, `oneOf`, `promiseAlike`, `regexp`, `strictEqual`, `string`, `stringifyEqual`
- **Env**
  - `assert`, `getEndianness`, `getEnvironment`, `getGlobal`, `global`, `tryRequire`, `tryRequireResolve`
- **Node**
  - **Data**
    - **Buffer**
      - `toArrayBuffer`
    - **BufferPacket**
      - `packBufferPacket`, `parseBufferPacket`
    - **LogQueue**
      - `createLogQueue`
    - **Stream**
      - `bufferToReadableStream`, `readableStreamToBufferAsync`, `readlineOfStreamAsync`, `setupStreamPipe`, `waitStreamStopAsync`, `writeBufferToStreamAsync`
    - `getRandomBufferAsync`
  - **File**
    - **Directory**
      - `copyDirectory`, `copyDirectoryInfoTree`, `createDirectory`, `deleteDirectory`, `deleteDirectoryInfoTree`, `getDirectoryInfoTree`, `getDirectorySubInfoList`, `getFileList`, `renameDirectoryInfoTree`, `walkDirectoryInfoTree`, `walkDirectoryInfoTreeBottomUp`
    - **Modify**
      - `modifyCopy`, `modifyDelete`, `modifyDeleteForce`, `modifyRename`
    - **Path**
      - `PATH_TYPE`, `STAT_ERROR`, `copyPath`, `createPathPrefixLock`, `deletePath`, `getPathStat`, `getPathTypeFromStat`, `nearestExistPath`, `renamePath`, `toPosixPath`
    - **Watch**
      - `createFileWatcher`
    - `appendFileAsync`, `closeAsync`, `copyFileAsync`, `createReadStream`, `createWriteStream`, `executableAsync`, `mkdirAsync`, `openAsync`, `readAsync`, `readFileAsync`, `readableAsync`, `readdirAsync`, `readlinkAsync`, `renameAsync`, `rmdirAsync`, `statAsync`, `symlinkAsync`, `truncateAsync`, `unlinkAsync`, `visibleAsync`, `writableAsync`, `writeAsync`, `writeFileAsync`
  - **Module**
    - **Option**
      - `createOptionParser`, `Preset`, `createOptionGetter`, `getOptionalFormatFlag`, `getOptionalFormatValue`, `parseOptionMap`, `prepareOption`
    - **EntityTag**
      - `getEntityTagByContentHash`, `getEntityTagByContentHashAsync`, `getWeakEntityTagByStat`
    - **Logger**
      - `createLogger`, `createSimpleLogger`
    - **SafeWrite**
      - `createSafeWriteStream`
  - **Server**
    - **Responder**
      - **Common**
        - `createResponderHostMapper`, `createResponderLog`, `createResponderLogEnd`, `createResponderSetHeaderHSTS`, `responderEnd`, `responderEndWithRedirect`, `responderEndWithStatusCode`, `responderSetHeaderCacheControlImmutable`
      - **RateLimit**
        - `createResponderCheckRateLimit`, `createResponderRateLimit`
      - **Router**
        - `METHOD_MAP`, `appendRouteMap`, `createResponderRouteListHTML`, `createResponderRouter`, `createRouteMap`, `describeRouteMap`, `getRouteParam`, `getRouteParamAny`
      - **Send**
        - `createResponderFavicon`, `prepareBufferData`, `prepareBufferDataAsync`, `responderSendBuffer`, `responderSendBufferCompress`, `responderSendBufferRange`, `responderSendJSON`, `responderSendStream`, `responderSendStreamCompress`, `responderSendStreamRange`
      - **ServeStatic**
        - `createDefaultCacheMap`, `createResponderBufferCache`, `createResponderServeStatic`
    - **WebSocket**
      - **WebSocket**
        - `createWebSocket`
      - **WebSocketClient**
        - `createWebSocketClient`
      - **WebSocketServer**
        - `enableWebSocketServer`
      - **WebSocketUpgradeRequest**
        - `createUpdateRequestListener`
      - `createFrameReceiverStore`, `listenAndReceiveFrame`, `createFrameSenderStore`, `encodeCloseFrame`, `encodeFrame`, `encodePingFrame`, `encodePongFrame`, `sendEncodedFrame`, `BUFFER_MAX_LENGTH`, `FRAME_CONFIG`, `OPCODE_TYPE`, `WEBSOCKET_EVENT`, `WEBSOCKET_VERSION`, `applyMaskQuadletBufferInPlace`, `getRequestKey`, `getRespondKey`
    - **Proxy**
      - `createTCPProxyListener`
    - **Server**
      - `createRequestListener`, `createServerPack`, `describeServerPack`
    - **CommonHTML**
      - `COMMON_FUNC_MAP`, `COMMON_LAYOUT`, `COMMON_SCRIPT`, `COMMON_STYLE`
    - **Function**
      - `autoTestServerPort`, `getUnusedPort`, `parseCookieString`
  - **System**
    - **DefaultOpen**
      - `getDefaultOpen`
    - **ExitListener**
      - `addExitListenerAsync`, `addExitListenerSync`, `clearExitListener`, `deleteExitListenerAsync`, `deleteExitListenerSync`
    - **Process**
      - `describeAllProcessStatusAsync`, `findProcessPidMapInfo`, `findProcessTreeInfo`, `getAllProcessStatusAsync`, `getProcessListAsync`, `isPidExist`, `killProcessInfoAsync`, `killProcessTreeInfoAsync`, `sortProcessList`, `toProcessPidMap`, `toProcessTree`
    - **Run**
      - `run`, `runSync`, `withCwd`
    - **Status**
      - `describeSystemActivity`, `describeSystemMemory`, `describeSystemNetwork`, `describeSystemPlatform`, `describeSystemProcessor`, `describeSystemStatus`, `getSystemActivity`, `getSystemMemory`, `getSystemNetwork`, `getSystemPlatform`, `getSystemProcessor`, `getSystemStatus`
  - **Net**
    - `fetchLikeRequest`, `fetchWithJump`, `ping`, `requestHttp`
  - **Resource**
    - `DR_BROWSER_FILE_PATH`, `DR_BROWSER_SCRIPT_TAG`, `loadJSON`, `loadLocalJSON`, `loadLocalScript`, `loadRemoteJSON`, `loadRemoteScript`, `loadScript`

#### Bin Option Format
📄 [source-bin/option.js](source-bin/option.js)
> ```
> CLI Usage:
>   --config --c -c [OPTIONAL] [ARGUMENT=1]
>       from ENV: set to "env" to enable, not using be default
>       from JS/JSON file: set to "path/to/file.config.js|json"
>   --help --h -h [OPTIONAL] [ARGUMENT=0+]
>       show full help
>   --quiet --q -q [OPTIONAL] [ARGUMENT=0+]
>       less log
>   --version --v -v [OPTIONAL] [ARGUMENT=0+]
>       show version
>   --json --J -J [OPTIONAL] [ARGUMENT=0+]
>       output JSON, if supported
>   --host --H -H [OPTIONAL] [ARGUMENT=1]
>       common option: $0=hostname:port (hostname default to 0.0.0.0)
>   --root --R -R [OPTIONAL] [ARGUMENT=1]
>       common option: $0=path/cwd
>   --input-file --I -I [OPTIONAL] [ARGUMENT=1]
>       common option
>   --output-file --O -O [OPTIONAL] [ARGUMENT=1]
>       common option
>   --eval --e -e [OPTIONAL] [ARGUMENT=0+]
>       eval file or string: -O=outputFile, -I/$0=scriptFile/scriptString, $@=...evalArgv
>   --repl --i -i [OPTIONAL] [ARGUMENT=0+]
>       start node REPL
>   --wait [OPTIONAL] [ARGUMENT=0-1]
>       wait specified time, in msec: $0=waitTime/2*1000
>   --echo [OPTIONAL] [ARGUMENT=0+]
>       show args: $@=...args
>   --cat [OPTIONAL] [ARGUMENT=0+]
>       with 0 args pipe stdin to stdout, else read $@ as file and pipe to stdout
>   --write [OPTIONAL] [ARGUMENT=1]
>       for use like ">": `dr-js --cat sourceFile | dr-js --write outputFile`
>   --append [OPTIONAL] [ARGUMENT=1]
>       for use like ">>": `dr-js --cat sourceFile | dr-js --append outputFile`
>   --merge [OPTIONAL] [ARGUMENT=2+]
>       merge to one file: $@=mergedFile,...inputFileList
>   --create-directory --mkdir [OPTIONAL] [ARGUMENT=0+]
>       create directory: $@=...pathList
>   --modify-copy --cp [OPTIONAL] [ARGUMENT=2]
>       copy path: $@=pathFrom,pathTo
>   --modify-rename --mv [OPTIONAL] [ARGUMENT=2]
>       rename path: $@=pathFrom,pathTo
>   --modify-delete --rm [OPTIONAL] [ARGUMENT=0+]
>       delete path: $@=...pathList
>   --status --s -s [OPTIONAL] [ARGUMENT=0+]
>       basic system status: -J=isOutputJSON
>   --open --o -o [OPTIONAL] [ARGUMENT=0-1]
>       use system default app to open uri or path: $0=uriOrPath/cwd
>   --fetch --f -f [OPTIONAL] [ARGUMENT=1-3]
>       fetch "GET" uri: -O=outputFile/stdout, $@=initialUrl,jumpMax/4,timeout/0
>   --process-status --ps [OPTIONAL] [ARGUMENT=0-1]
>       show system process status: -J=isOutputJSON, $0=outputMode/"pid--"
>   --json-format --jf [OPTIONAL] [ARGUMENT=0-1]
>       re-format JSON file: -O=outputFile/-I, -I=inputFile, $0=unfoldLevel/2
>   --server-serve-static --sss [OPTIONAL] [ARGUMENT=0-1]
>       static file server: -H=hostname:port, -R=staticRoot/cwd, $0=expireTime/5*1000
>   --server-serve-static-simple --ssss [OPTIONAL] [ARGUMENT=0-1]
>       static file server, no HTML: -H=hostname:port, -R=staticRoot/cwd, $0=expireTime/5*1000
>   --server-websocket-group --swg [OPTIONAL]
>       websocket chat server: -H=hostname:port
>   --server-test-connection --stc [OPTIONAL]
>       connection test server: -H=hostname:port
>   --server-tcp-proxy --stp [OPTIONAL] [ARGUMENT=1+]
>       tcp proxy server: -H=hostname:port, $@=toHostname:toPort,toHostname:toPort,...
> ENV Usage:
>   "
>     #!/usr/bin/env bash
>     export DR_JS_CONFIG="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_HELP="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_QUIET="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_VERSION="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_JSON="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_HOST="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_ROOT="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_INPUT_FILE="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_OUTPUT_FILE="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_EVAL="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_REPL="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_WAIT="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_ECHO="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_CAT="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_WRITE="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_APPEND="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_MERGE="[OPTIONAL] [ARGUMENT=2+]"
>     export DR_JS_CREATE_DIRECTORY="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_MODIFY_COPY="[OPTIONAL] [ARGUMENT=2]"
>     export DR_JS_MODIFY_RENAME="[OPTIONAL] [ARGUMENT=2]"
>     export DR_JS_MODIFY_DELETE="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_STATUS="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_OPEN="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_FETCH="[OPTIONAL] [ARGUMENT=1-3]"
>     export DR_JS_PROCESS_STATUS="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_JSON_FORMAT="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_SERVER_SERVE_STATIC="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_SERVER_SERVE_STATIC_SIMPLE="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_SERVER_WEBSOCKET_GROUP="[OPTIONAL]"
>     export DR_JS_SERVER_TEST_CONNECTION="[OPTIONAL]"
>     export DR_JS_SERVER_TCP_PROXY="[OPTIONAL] [ARGUMENT=1+]"
>   "
> CONFIG Usage:
>   {
>     "config": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "help": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "quiet": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "version": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "json": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "host": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "root": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "inputFile": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "outputFile": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "eval": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "repl": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "wait": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "echo": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "cat": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "write": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "append": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "merge": [ "[OPTIONAL] [ARGUMENT=2+]" ],
>     "createDirectory": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "modifyCopy": [ "[OPTIONAL] [ARGUMENT=2]" ],
>     "modifyRename": [ "[OPTIONAL] [ARGUMENT=2]" ],
>     "modifyDelete": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "status": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "open": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "fetch": [ "[OPTIONAL] [ARGUMENT=1-3]" ],
>     "processStatus": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "jsonFormat": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "serverServeStatic": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "serverServeStaticSimple": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "serverWebsocketGroup": [ "[OPTIONAL]" ],
>     "serverTestConnection": [ "[OPTIONAL]" ],
>     "serverTcpProxy": [ "[OPTIONAL] [ARGUMENT=1+]" ],
>   }
> ```
