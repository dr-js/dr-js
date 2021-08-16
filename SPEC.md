# Specification

* [Export Path](#export-path)
* [Export Tree](#export-tree)
* [Bin Option Format](#bin-option-format)

#### Export Path
+ 📄 [source/browser/DOM.js](source/browser/DOM.js)
  - `applyReceiveFileListListener`, `createDownload`, `createDownloadWithBlob`, `createDownloadWithObject`, `createDownloadWithString`, `createElement`, `deleteArrayBufferCache`, `getElementAtViewport`, `getPathElementList`, `loadArrayBufferCache`, `saveArrayBufferCache`, `throttleByAnimationFrame`
+ 📄 [source/browser/net.js](source/browser/net.js)
  - `fetchLikeRequest`
+ 📄 [source/browser/resource.js](source/browser/resource.js)
  - `createDownload`, `createDownloadWithBlob`, `createDownloadWithObject`, `createDownloadWithString`, `deleteArrayBufferCache`, `loadArrayBufferCache`, `loadImage`, `loadScript`, `loadText`, `saveArrayBufferCache`
+ 📄 [source/browser/canvas/Color.js](source/browser/canvas/Color.js)
  - `hexCSSFromRgb`, `hexCSSFromRgba`, `rgbaFromUint32`, `uint32FromRgba`
+ 📄 [source/browser/canvas/ImageData.js](source/browser/canvas/ImageData.js)
  - `applyCanvasElementExt`, `applyCanvasImageDataExt`, `applyImageElementExt`, `canvasElementToCanvasImageData`, `canvasImageDataToCanvasElement`, `createCanvasElement`, `createCanvasImageData`, `createImageElement`, `getQuickCanvas`, `getQuickContext2d`, `imageElementToCanvasElement`, `imageElementToCanvasImageData`
+ 📄 [source/browser/canvas/ImageDataOperation.js](source/browser/canvas/ImageDataOperation.js)
  - `crop`, `drawPixel`, `drawPixelLine`, `drawPixelLineList`, `floodFill`, `getPixelColor`, `replacePixelColor`, `scale`
+ 📄 [source/browser/canvas/function.js](source/browser/canvas/function.js)
  - `loadImage`, `loadText`
+ 📄 [source/browser/canvas/Font/fontGenerator.js](source/browser/canvas/Font/fontGenerator.js)
  - `createFontGenerator`
+ 📄 [source/browser/canvas/Font/fontGeneratorBitmap.js](source/browser/canvas/Font/fontGeneratorBitmap.js)
  - `createFontGeneratorBitmap`
+ 📄 [source/browser/canvas/Font/fontMapper.js](source/browser/canvas/Font/fontMapper.js)
  - `createFontMapper`
+ 📄 [source/browser/canvas/Font/fontRender.js](source/browser/canvas/Font/fontRender.js)
  - `createFontRender`
+ 📄 [source/browser/canvas/Font/fontRenderBitmap.js](source/browser/canvas/Font/fontRenderBitmap.js)
  - `createFontRenderBitmap`
+ 📄 [source/browser/data/Blob.js](source/browser/data/Blob.js)
  - `Blob`, `parseBlobAsArrayBuffer`, `parseBlobAsDataURL`, `parseBlobAsText`
+ 📄 [source/browser/data/BlobPacket.js](source/browser/data/BlobPacket.js)
  - `packBlobPacket`, `parseBlobPacket`
+ 📄 [source/browser/input/EnhancedEventProcessor.js](source/browser/input/EnhancedEventProcessor.js)
  - `createSwipeEnhancedEventProcessor`
+ 📄 [source/browser/input/KeyCommand.js](source/browser/input/KeyCommand.js)
  - `createKeyCommandHub`
+ 📄 [source/browser/input/PointerEvent.js](source/browser/input/PointerEvent.js)
  - `ENHANCED_POINTER_EVENT_TYPE`, `POINTER_EVENT_TYPE`, `applyEnhancedPointerEventListener`, `applyPointerEventListener`
+ 📄 [source/browser/module/FileChunkUpload.js](source/browser/module/FileChunkUpload.js)
  - `uploadFileByChunk`
+ 📄 [source/browser/module/HistoryStateStore.js](source/browser/module/HistoryStateStore.js)
  - `createHistoryStateStore`
+ 📄 [source/browser/module/LocalStorageStateStore.js](source/browser/module/LocalStorageStateStore.js)
  - `createLocalStorageStateStore`
+ 📄 [source/browser/module/MotionAutoTimer.js](source/browser/module/MotionAutoTimer.js)
  - `createInterpolationAutoTimer`, `createVectorAccumulator`
+ 📄 [source/common/check.js](source/common/check.js)
  - `isArrayBuffer`, `isArrayLength`, `isBasicArray`, `isBasicFunction`, `isBasicObject`, `isBoolean`, `isFunctionThrow`, `isFunctionThrowAsync`, `isInteger`, `isNumber`, `isObjectAlike`, `isObjectContain`, `isObjectKey`, `isOneOf`, `isPromiseAlike`, `isRegExp`, `isStrictEqual`, `isString`, `isStringifyEqual`, `isTruthy`
+ 📄 [source/common/compare.js](source/common/compare.js)
  - `compareString`, `compareStringLocale`, `compareStringWithNumber`
+ 📄 [source/common/error.js](source/common/error.js)
  - `catchAsync`, `catchPromise`, `catchSync`, `remessageError`, `rethrowError`, `tryCall`
+ 📄 [source/common/format.js](source/common/format.js)
  - `binary`, `decimal`, `describe`, `mediaTime`, `padTable`, `percent`, `prettyStringifyConfigObject`, `prettyStringifyJSON`, `time`, `typeNameOf`
+ 📄 [source/common/function.js](source/common/function.js)
  - `createInsideOutPromise`, `debounce`, `lossyAsync`, `once`, `throttle`, `withCache`, `withCacheAsync`, `withDelayArgvQueue`, `withRepeat`, `withRepeatAsync`, `withRetry`, `withRetryAsync`, `withTimeoutAsync`, `withTimeoutPromise`
+ 📄 [source/common/string.js](source/common/string.js)
  - `autoEllipsis`, `createMarkReplacer`, `escapeHTML`, `escapeRegExp`, `filterJoin`, `forEachLine`, `forEachRegExpExec`, `indentLine`, `indentList`, `joinCamelCase`, `joinKebabCase`, `joinSnakeCase`, `lazyEncodeURI`, `removeInvalidCharXML`, `replaceAll`, `splitCamelCase`, `splitKebabCase`, `splitSnakeCase`, `unescapeHTML`
+ 📄 [source/common/test.js](source/common/test.js)
  - `createTest`
+ 📄 [source/common/time.js](source/common/time.js)
  - `CLOCK_PER_SECOND`, `CLOCK_TO_SECOND`, `cancelFrameUpdate`, `clock`, `createStepper`, `createTimer`, `getTimestamp`, `requestFrameUpdate`, `setAwaitAsync`, `setTimeoutAsync`, `setWeakInterval`, `setWeakTimeout`
+ 📄 [source/common/verify.js](source/common/verify.js)
  - `arrayBuffer`, `arrayLength`, `basicArray`, `basicFunction`, `basicObject`, `boolean`, `doNotThrow`, `doNotThrowAsync`, `doThrow`, `doThrowAsync`, `includes`, `integer`, `notIncludes`, `notStrictEqual`, `notStringifyEqual`, `number`, `objectAlike`, `objectContain`, `objectKey`, `oneOf`, `promiseAlike`, `regexp`, `strictEqual`, `string`, `stringifyEqual`, `truthy`
+ 📄 [source/common/data/ArrayBuffer.js](source/common/data/ArrayBuffer.js)
  - `calcSHA256ArrayBuffer`, `concatArrayBuffer`, `deconcatArrayBuffer`, `fromNodejsBuffer`, `fromString`, `fromU16String`, `isEqualArrayBuffer`, `toString`, `toU16String`
+ 📄 [source/common/data/ArrayBufferPacket.js](source/common/data/ArrayBufferPacket.js)
  - `HEADER_BYTE_SIZE`, `MAX_PACKET_HEADER_SIZE`, `packArrayBufferHeader`, `packArrayBufferPacket`, `packChainArrayBufferPacket`, `parseArrayBufferHeader`, `parseArrayBufferPacket`, `parseChainArrayBufferPacket`
+ 📄 [source/common/data/Base64.js](source/common/data/Base64.js)
  - `decode`, `encode`
+ 📄 [source/common/data/CacheMap.js](source/common/data/CacheMap.js)
  - `createCache`, `createCacheMap`
+ 📄 [source/common/data/DataUri.js](source/common/data/DataUri.js)
  - `decode`, `encode`
+ 📄 [source/common/data/Iter.js](source/common/data/Iter.js)
  - `createLockStepAsyncIter`, `unwrap`, `wrapAsync`, `wrapSync`
+ 📄 [source/common/data/LinkedList.js](source/common/data/LinkedList.js)
  - `createDoublyLinkedList`, `createNode`
+ 📄 [source/common/data/ListMap.js](source/common/data/ListMap.js)
  - `createListMap`
+ 📄 [source/common/data/LoopIndex.js](source/common/data/LoopIndex.js)
  - `createLoopIndex`
+ 📄 [source/common/data/MapMap.js](source/common/data/MapMap.js)
  - `createMapMap`, `getInvertMapMap`
+ 📄 [source/common/data/SaveQueue.js](source/common/data/SaveQueue.js)
  - `createSaveQueue`
+ 📄 [source/common/data/SetMap.js](source/common/data/SetMap.js)
  - `createSetMap`, `getInvertSetMap`
+ 📄 [source/common/data/Toggle.js](source/common/data/Toggle.js)
  - `createToggle`
+ 📄 [source/common/data/Tree.js](source/common/data/Tree.js)
  - `createTreeBottomUpSearch`, `createTreeBottomUpSearchAsync`, `createTreeBreadthFirstSearch`, `createTreeBreadthFirstSearchAsync`, `createTreeDepthFirstSearch`, `createTreeDepthFirstSearchAsync`, `prettyStringifyTreeNode`
+ 📄 [source/common/data/function.js](source/common/data/function.js)
  - `dupJSON`, `getValueByKeyList`, `hashStringToNumber`, `reverseString`, `swapObfuscateString`, `tryParseJSONObject`
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
+ 📄 [source/common/module/AsyncFuncQueue.js](source/common/module/AsyncFuncQueue.js)
  - `createAsyncFuncQueue`
+ 📄 [source/common/module/AsyncLane.js](source/common/module/AsyncLane.js)
  - `createAsyncLane`, `extendAutoSelectByTagLane`, `extendAutoSelectLane`, `extendLaneValueList`, `extendLaneValueMap`, `selectByTagOrMinLoadLane`, `selectMinLoadLane`
+ 📄 [source/common/module/AsyncTask.js](source/common/module/AsyncTask.js)
  - `ASYNC_TASK_KEY_MAP`, `ASYNC_TASK_PHASE_MAP`, `getAsyncTaskPhase`, `resetAsyncTask`, `runAsyncTask`
+ 📄 [source/common/module/AsyncTaskQueue.js](source/common/module/AsyncTaskQueue.js)
  - `ASYNC_TASK_QUEUE_KEY_MAP`, `createAsyncTaskQueue`, `createFilterStaleAsyncTask`
+ 📄 [source/common/module/BlockChart.js](source/common/module/BlockChart.js)
  - `getBlockBar`, `getBlockChart`
+ 📄 [source/common/module/ChunkUpload.js](source/common/module/ChunkUpload.js)
  - `packArrayBufferChunk`, `parseArrayBufferChunk`, `uploadArrayBufferByChunk`
+ 📄 [source/common/module/Event.js](source/common/module/Event.js)
  - `createEventEmitter`, `createEventTarget`, `createHub`
+ 📄 [source/common/module/Exot.js](source/common/module/Exot.js)
  - `createDummyExot`, `createExotError`, `createExotGroup`, `findExotMapValue`, `isExot`, `mapExotMapValue`, `toExotMap`
+ 📄 [source/common/module/HTML.js](source/common/module/HTML.js)
  - `COMMON_FUNC_MAP`, `COMMON_LAYOUT`, `COMMON_SCRIPT`, `COMMON_STYLE`, `simpleCompactCSS`, `styleTagMerge`
+ 📄 [source/common/module/KeySelector.js](source/common/module/KeySelector.js)
  - `concatKeyFrag`, `createMultiKeySwitch`, `reduceKeySelector`
+ 📄 [source/common/module/KeyTree.js](source/common/module/KeyTree.js)
  - `createKeyTree`, `createKeyTreeEnhanced`
+ 📄 [source/common/module/LevenshteinDistance.js](source/common/module/LevenshteinDistance.js)
  - `getLevenshteinDistance`
+ 📄 [source/common/module/MIME.js](source/common/module/MIME.js)
  - `BASIC_EXTENSION_MAP`, `DEFAULT_MIME`, `getMIMETypeFromFileName`
+ 📄 [source/common/module/PackageJSON.js](source/common/module/PackageJSON.js)
  - `collectDependency`, `getFirstBinPath`, `packPackageJSON`, `parsePackageNameAndVersion`, `sortPackageJSON`, `toPackageInfo`, `toPackageTgzName`
+ 📄 [source/common/module/Patch.js](source/common/module/Patch.js)
  - `createPatchKit`, `toArrayWithKeyPatchKit`, `toObjectPatchKit`
+ 📄 [source/common/module/RouteMap.js](source/common/module/RouteMap.js)
  - `appendRouteMap`, `createRouteMap`, `findRouteFromMap`, `getRouteParam`, `getRouteParamAny`, `parseRouteToMap`, `parseRouteUrl`
+ 📄 [source/common/module/Runlet.js](source/common/module/Runlet.js)
  - `ChipSyncBasic`, `END`, `KEY_PEND_INPUT`, `KEY_PEND_OUTPUT`, `KEY_POOL_IO`, `PoolIO`, `REDO`, `SKIP`, `TYPE_LOGICAL_PENDVIEW`, `TYPE_LOGICAL_PENDVIEWEE`, `clearPack`, `createArrayInputChip`, `createArrayOutputChip`, `createAsyncIteratorInputChip`, `createAsyncIteratorOutputChip`, `createCountPool`, `createENDRegulatorChip`, `createLogicalCountPool`, `createPack`, `createRunlet`, `describePack`, `quickConfigPend`, `toChipMap`, `toLinearChipList`, `toPoolMap`
+ 📄 [source/common/module/RunletChip.js](source/common/module/RunletChip.js)
  - `createArrayInputChip`, `createArrayOutputChip`, `createAsyncIterInputChip`, `createAsyncIterOutputChip`, `createAsyncIteratorInputChip`, `createAsyncIteratorOutputChip`, `createENDRegulatorChip`
+ 📄 [source/common/module/SemVer.js](source/common/module/SemVer.js)
  - `compareSemVer`, `isVersionSpecComplex`, `parseSemVer`, `versionBumpByGitBranch`, `versionBumpLastNumber`, `versionBumpToIdentifier`, `versionBumpToLocal`
+ 📄 [source/common/module/TimedLookup.js](source/common/module/TimedLookup.js)
  - `generateCheckCode`, `generateLookupData`, `packCheckCode`, `packDataArrayBuffer`, `parseCheckCode`, `parseDataArrayBuffer`, `verifyCheckCode`, `verifyOption`, `verifyParsedCheckCode`
+ 📄 [source/common/module/TimerTag.js](source/common/module/TimerTag.js)
  - `calcDate`, `packTimerTag`, `parseTimerTag`
+ 📄 [source/common/module/TupleHasherDev.js](source/common/module/TupleHasherDev.js)
  - `createTupleHasher`
+ 📄 [source/common/module/UpdateLoop.js](source/common/module/UpdateLoop.js)
  - `createUpdateLoop`, `createUpdater`
+ 📄 [source/common/mutable/Object.js](source/common/mutable/Object.js)
  - `objectMergeDeep`, `objectSortKey`
+ 📄 [source/env/function.js](source/env/function.js)
  - `assert`, `getEndianness`
+ 📄 [source/env/global.js](source/env/global.js)
  - `getEnvironment`, `getGlobal`
+ 📄 [source/env/tryRequire.js](source/env/tryRequire.js)
  - `tryRequire`, `tryRequireResolve`
+ 📄 [source/node/kit.js](source/node/kit.js)
  - `argvFlag`, `getKit`, `getKitLogger`, `getKitPathCombo`, `getKitRun`, `loadEnvKey`, `runKit`, `saveEnvKey`, `syncEnvKey`
+ 📄 [source/node/net.js](source/node/net.js)
  - `fetchLikeRequest`, `fetchWithJump`, `ping`, `requestHttp`
+ 📄 [source/node/resource.js](source/node/resource.js)
  - `DR_BROWSER_FILE_PATH`, `DR_BROWSER_SCRIPT_TAG`, `loadJSON`, `loadLocalJSON`, `loadLocalScript`, `loadRemoteJSON`, `loadRemoteScript`, `loadScript`
+ 📄 [source/node/run.js](source/node/run.js)
  - `describeRunOutcome`, `describeRunOutcomeSync`, `run`, `runDetached`, `runStdout`, `runStdoutSync`, `runSync`
+ 📄 [source/node/data/Buffer.js](source/node/data/Buffer.js)
  - `calcHash`, `createBufferRefragPool`, `getRandomBufferAsync`, `toArrayBuffer`
+ 📄 [source/node/data/BufferPacket.js](source/node/data/BufferPacket.js)
  - `packBufferPacket`, `parseBufferPacket`
+ 📄 [source/node/data/Stream.js](source/node/data/Stream.js)
  - `bufferToReadableStream`, `createReadableStreamInputChip`, `createTransformStreamChip`, `createWritableStreamOutputChip`, `isReadableStream`, `isWritableStream`, `quickRunletFromStream`, `readableStreamToBufferAsync`, `readlineOfStreamAsync`, `setupStreamPipe`, `waitStreamStopAsync`, `writeBufferToStreamAsync`
+ 📄 [source/node/data/Z64String.js](source/node/data/Z64String.js)
  - `packBr64`, `packGz64`, `unpackBr64`, `unpackGz64`
+ 📄 [source/node/file/Directory.js](source/node/file/Directory.js)
  - `copyDirInfoTree`, `copyDirectory`, `createDirectory`, `deleteDirInfoTree`, `deleteDirectory`, `getDirInfoList`, `getDirInfoTree`, `getFileList`, `getPathTypeFromDirent`, `renameDirInfoTree`, `resetDirectory`, `walkDirInfoTreeAsync`, `walkDirInfoTreeBottomUpAsync`
+ 📄 [source/node/file/Modify.js](source/node/file/Modify.js)
  - `modifyCopy`, `modifyDelete`, `modifyDeleteForce`, `modifyRename`
+ 📄 [source/node/file/Path.js](source/node/file/Path.js)
  - `PATH_TYPE`, `STAT_ERROR`, `copyPath`, `createPathPrefixLock`, `deletePath`, `dropTrailingSep`, `existPath`, `getPathLstat`, `getPathStat`, `getPathTypeFromStat`, `nearestExistPath`, `renamePath`, `toPosixPath`
+ 📄 [source/node/file/Watch.js](source/node/file/Watch.js)
  - `createFileWatcherExot`
+ 📄 [source/node/fs/Checksum.js](source/node/fs/Checksum.js)
  - `describeChecksumInfoList`, `describeChecksumOfPathList`, `getChecksumInfoListOfPath`, `getChecksumInfoListOfPathList`, `getChecksumInfoOfFile`
+ 📄 [source/node/fs/Directory.js](source/node/fs/Directory.js)
  - `copyDirInfoTree`, `copyDirectory`, `createDirectory`, `deleteDirInfoTree`, `deleteDirectory`, `getDirInfoList`, `getDirInfoTree`, `getFileList`, `getPathTypeFromDirent`, `renameDirInfoTree`, `resetDirectory`, `walkDirInfoTreeAsync`, `walkDirInfoTreeBottomUpAsync`, `withTempDirectory`
+ 📄 [source/node/fs/File.js](source/node/fs/File.js)
  - `appendArrayBuffer`, `appendBuffer`, `appendText`, `editArrayBuffer`, `editBuffer`, `editJSON`, `editJSONPretty`, `editText`, `readArrayBuffer`, `readBuffer`, `readJSON`, `readJSONAlike`, `readText`, `writeArrayBuffer`, `writeBuffer`, `writeJSON`, `writeJSONPretty`, `writeText`
+ 📄 [source/node/fs/Modify.js](source/node/fs/Modify.js)
  - `modifyCopy`, `modifyDelete`, `modifyDeleteForce`, `modifyRename`
+ 📄 [source/node/fs/Path.js](source/node/fs/Path.js)
  - `PATH_TYPE`, `STAT_ERROR`, `addTrailingSep`, `copyPath`, `createPathPrefixLock`, `deletePath`, `deletePathForce`, `dropTrailingSep`, `existPath`, `expandHome`, `getPathLstat`, `getPathStat`, `getPathTypeFromStat`, `nearestExistPath`, `renamePath`, `resolveHome`, `toPosixPath`
+ 📄 [source/node/fs/Watch.js](source/node/fs/Watch.js)
  - `createFileWatcherExot`
+ 📄 [source/node/module/Auth.js](source/node/module/Auth.js)
  - `AUTH_FILE`, `AUTH_FILE_GROUP`, `AUTH_SKIP`, `DEFAULT_AUTH_KEY`, `configureAuth`, `configureAuthFile`, `configureAuthFileGroup`, `configureAuthSkip`, `describeAuthFile`, `generateAuthCheckCode`, `generateAuthFile`, `loadAuthFile`, `saveAuthFile`, `verifyAuthCheckCode`
+ 📄 [source/node/module/EntityTag.js](source/node/module/EntityTag.js)
  - `getEntityTagByContentHash`, `getEntityTagByContentHashAsync`, `getWeakEntityTagByStat`
+ 📄 [source/node/module/FactDatabase.js](source/node/module/FactDatabase.js)
  - `INITIAL_FACT_INFO`, `createFactDatabaseExot`, `tryDeleteExtraCache`, `tryLoadFactInfo`
+ 📄 [source/node/module/FileChunkUpload.js](source/node/module/FileChunkUpload.js)
  - `createOnFileChunkUpload`, `uploadFileByChunk`
+ 📄 [source/node/module/FsPack.js](source/node/module/FsPack.js)
  - `TYPE_DIRECTORY`, `TYPE_FILE`, `TYPE_SYMLINK`, `append`, `appendContentList`, `appendDirectory`, `appendFile`, `appendFromPath`, `appendSymlink`, `initFsPack`, `loadFsPack`, `saveFsPack`, `setFsPackPackRoot`, `setFsPackUnpackPath`, `unpack`, `unpackContentList`, `unpackDirectory`, `unpackFile`, `unpackSymlink`, `unpackToPath`
+ 📄 [source/node/module/Log.js](source/node/module/Log.js)
  - `configureLog`
+ 📄 [source/node/module/Logger.js](source/node/module/Logger.js)
  - `createLoggerExot`, `createSimpleLoggerExot`
+ 📄 [source/node/module/PackageJSON.js](source/node/module/PackageJSON.js)
  - `editPackageJSON`, `loadPackageCombo`, `loadPackageInfo`, `loadPackageInfoList`, `savePackageInfo`, `toPackageJSONPath`, `toPackageRootPath`, `writePackageJSON`
+ 📄 [source/node/module/Permission.js](source/node/module/Permission.js)
  - `configurePermission`
+ 📄 [source/node/module/Pid.js](source/node/module/Pid.js)
  - `configurePid`
+ 📄 [source/node/module/PingRace.js](source/node/module/PingRace.js)
  - `PING_STAT_ERROR`, `pingRaceUrlList`, `pingStatUrlList`
+ 📄 [source/node/module/RuntimeDump.js](source/node/module/RuntimeDump.js)
  - `dumpAsync`, `getV8Extra`, `getV8HeapSnapshotReadableStream`, `setupSIGUSR2`, `writeV8HeapSnapshot`
+ 📄 [source/node/module/SafeWrite.js](source/node/module/SafeWrite.js)
  - `createSafeWriteStream`
+ 📄 [source/node/module/TerminalColor.js](source/node/module/TerminalColor.js)
  - `configureTerminalColor`
+ 📄 [source/node/module/TerminalStatusBar.js](source/node/module/TerminalStatusBar.js)
  - `createStatusBar`
+ 📄 [source/node/module/function.js](source/node/module/function.js)
  - `createArgListPack`, `probeSync`, `spawnString`
+ 📄 [source/node/module/ActionJSON/path.js](source/node/module/ActionJSON/path.js)
  - `ACTION_CORE_MAP`, `ACTION_TYPE`, `setupActionMap`
+ 📄 [source/node/module/ActionJSON/pathExtraArchive.js](source/node/module/ActionJSON/pathExtraArchive.js)
  - `ACTION_CORE_MAP`, `ACTION_TYPE`
+ 📄 [source/node/module/ActionJSON/status.js](source/node/module/ActionJSON/status.js)
  - `ACTION_CORE_MAP`, `ACTION_TYPE`, `setupActionMap`
+ 📄 [source/node/module/Archive/7z.js](source/node/module/Archive/7z.js)
  - `check`, `compressArgs`, `extractArgs`, `getArgs`, `setArgs`, `verify`
+ 📄 [source/node/module/Archive/archive.js](source/node/module/Archive/archive.js)
  - `REGEXP_AUTO`, `check`, `compress7zAsync`, `compressAutoAsync`, `compressT7zAsync`, `extract7zAsync`, `extractAutoAsync`, `extractT7zAsync`, `repackAsync`, `repackTarAsync`, `verify`
+ 📄 [source/node/module/Archive/fsp.js](source/node/module/Archive/fsp.js)
  - `REGEXP_FSP`, `compressAsync`, `compressFspAsync`, `compressFspGzBrAsync`, `extractAsync`, `extractFspAsync`, `extractFspGzBrAsync`
+ 📄 [source/node/module/Archive/function.js](source/node/module/Archive/function.js)
  - `REGEXP_BR`, `REGEXP_GZ`, `REGEXP_GZBR`, `REGEXP_T7Z`, `REGEXP_TBR`, `REGEXP_TGZ`, `REGEXP_TXZ`, `compressGzBrFileAsync`, `createBrotliCompressMax`, `createGzipMax`, `extractGzBrFileAsync`, `isBufferGzip`, `isFileGzip`, `withTempPath`
+ 📄 [source/node/module/Archive/npmTar.js](source/node/module/Archive/npmTar.js)
  - `REGEXP_NPM_TAR`, `check`, `compressAsync`, `createCompressStream`, `createExtractStream`, `extractAsync`, `extractPackageJSON`, `extractPackageJson`, `getNpmTar`, `verify`
+ 📄 [source/node/module/Archive/tar.js](source/node/module/Archive/tar.js)
  - `check`, `compressArgs`, `extractArgs`, `getArgs`, `setArgs`, `verify`
+ 📄 [source/node/module/Option/parser.js](source/node/module/Option/parser.js)
  - `createOptionParser`
+ 📄 [source/node/module/Option/preset.js](source/node/module/Option/preset.js)
  - `Preset`, `createOptionGetter`, `getOptionalFormatFlag`, `getOptionalFormatValue`, `parseOptionMap`, `prepareOption`
+ 📄 [source/node/module/Software/bash.js](source/node/module/Software/bash.js)
  - `catStringToFileCommand`, `check`, `commonBashArgList`, `commonCommandList`, `commonSourceProfileCommandList`, `getArgs`, `gitCleanUpCommandList`, `gitFetchBranchCommandList`, `joinCommand`, `runBash`, `runBashCommand`, `runBashCommandSync`, `runBashStdout`, `runBashStdoutSync`, `runBashSync`, `setArgs`, `subShellCommandList`, `toHeredocNoMagic`, `verify`
+ 📄 [source/node/module/Software/docker.js](source/node/module/Software/docker.js)
  - `check`, `checkCompose`, `checkLocalImage`, `checkPullImage`, `getArgs`, `getArgsCompose`, `getContainerLsList`, `matchContainerLsList`, `patchContainerLsListStartedAt`, `pullImage`, `runCompose`, `runComposeStdout`, `runComposeStdoutSync`, `runComposeSync`, `runDocker`, `runDockerStdout`, `runDockerStdoutSync`, `runDockerSync`, `setArgs`, `setArgsCompose`, `verify`, `verifyCompose`
+ 📄 [source/node/module/Software/git.js](source/node/module/Software/git.js)
  - `check`, `getArgs`, `getGitBranch`, `getGitCommitHash`, `getGitCommitMessage`, `runGit`, `runGitStdout`, `runGitStdoutSync`, `runGitSync`, `setArgs`, `verify`
+ 📄 [source/node/module/Software/hostStatus.js](source/node/module/Software/hostStatus.js)
  - `COMMON_HOST_STATUS_COMMAND_LIST`, `getCommonHostStatus`
+ 📄 [source/node/module/Software/npm.js](source/node/module/Software/npm.js)
  - `fetchLikeRequestWithProxy`, `fetchWithJumpProxy`, `findUpPackageRoot`, `fromGlobalNodeModules`, `fromNpmNodeModules`, `getPathNpm`, `getPathNpmExecutable`, `getPathNpmGlobalRoot`, `getSudoArgs`, `hasRepoVersion`, `parsePackageNameAndVersion`, `runNpm`, `runNpmStdout`, `runNpmStdoutSync`, `runNpmSync`, `runSudoNpm`, `runSudoNpmStdout`, `runSudoNpmStdoutSync`, `runSudoNpmSync`, `toPackageTgzName`
+ 📄 [source/node/server/Proxy.js](source/node/server/Proxy.js)
  - `createTCPProxyListener`
+ 📄 [source/node/server/Server.js](source/node/server/Server.js)
  - `createRequestListener`, `createServerExot`, `describeServerOption`
+ 📄 [source/node/server/commonHTML.js](source/node/server/commonHTML.js)
  - `COMMON_FUNC_MAP`, `COMMON_LAYOUT`, `COMMON_SCRIPT`, `COMMON_STYLE`, `DR_BROWSER_FILE_PATH`, `DR_BROWSER_SCRIPT_TAG`, `simpleCompactCSS`, `styleTagMerge`
+ 📄 [source/node/server/function.js](source/node/server/function.js)
  - `DR_BROWSER_FILE_PATH`, `DR_BROWSER_SCRIPT_TAG`, `autoTestServerPort`, `getRequestBuffer`, `getRequestJSON`, `getRequestParam`, `getUnusedPort`, `getWSProtocolListParam`, `isPrivateAddress`, `packWSProtocolListParam`, `parseCookieString`, `parseHostString`
+ 📄 [source/node/server/Feature/@/configure.js](source/node/server/Feature/@/configure.js)
  - `configureFeature`, `configureServerExot`, `runServer`, `runServerExotGroup`, `setupServerExotGroup`
+ 📄 [source/node/server/Feature/@/option.js](source/node/server/Feature/@/option.js)
  - `LogFormatConfig`, `PidFormatConfig`, `getLogOption`, `getPidOption`, `getServerExotFormatConfig`, `getServerExotOption`
+ 📄 [source/node/server/Feature/@/HTML/LoadingMask.js](source/node/server/Feature/@/HTML/LoadingMask.js)
  - `initLoadingMask`
+ 📄 [source/node/server/Feature/@/HTML/Modal.js](source/node/server/Feature/@/HTML/Modal.js)
  - `initModal`
+ 📄 [source/node/server/Feature/ActionJSON/client.js](source/node/server/Feature/ActionJSON/client.js)
  - `actionJSON`, `actionJson`
+ 📄 [source/node/server/Feature/ActionJSON/setup.js](source/node/server/Feature/ActionJSON/setup.js)
  - `PERMISSION_CHECK_ACTION_JSON`, `PERMISSION_CHECK_ACTION_JSON_PUBLIC`, `setup`
+ 📄 [source/node/server/Feature/Auth/HTML.js](source/node/server/Feature/Auth/HTML.js)
  - `initAuthMask`
+ 📄 [source/node/server/Feature/Auth/option.js](source/node/server/Feature/Auth/option.js)
  - `AuthCommonFormatConfig`, `AuthFileFormatConfig`, `AuthFileGroupFormatConfig`, `AuthSkipFormatConfig`, `getAuthCommonOption`, `getAuthFileGroupOption`, `getAuthFileOption`, `getAuthSkipOption`
+ 📄 [source/node/server/Feature/Auth/setup.js](source/node/server/Feature/Auth/setup.js)
  - `setup`
+ 📄 [source/node/server/Feature/Explorer/option.js](source/node/server/Feature/Explorer/option.js)
  - `ExplorerFormatConfig`, `getExplorerOption`
+ 📄 [source/node/server/Feature/Explorer/setup.js](source/node/server/Feature/Explorer/setup.js)
  - `setup`
+ 📄 [source/node/server/Feature/Explorer/HTML/main.js](source/node/server/Feature/Explorer/HTML/main.js)
  - `getHTML`
+ 📄 [source/node/server/Feature/Explorer/HTML/pathContent.js](source/node/server/Feature/Explorer/HTML/pathContent.js)
  - `initPathContent`, `pathContentStyle`
+ 📄 [source/node/server/Feature/Explorer/HTML/uploader.js](source/node/server/Feature/Explorer/HTML/uploader.js)
  - `initUploader`
+ 📄 [source/node/server/Feature/File/client.js](source/node/server/Feature/File/client.js)
  - `fileDownload`, `fileUpload`
+ 📄 [source/node/server/Feature/File/option.js](source/node/server/Feature/File/option.js)
  - `FileFormatConfig`, `getFileOption`
+ 📄 [source/node/server/Feature/File/responder.js](source/node/server/Feature/File/responder.js)
  - `createResponderFileChunkUpload`, `createResponderServeFile`
+ 📄 [source/node/server/Feature/File/setup.js](source/node/server/Feature/File/setup.js)
  - `PERMISSION_CHECK_FILE_UPLOAD_START`, `setup`
+ 📄 [source/node/server/Feature/Permission/option.js](source/node/server/Feature/Permission/option.js)
  - `PermissionFormatConfig`, `getPermissionOption`
+ 📄 [source/node/server/Feature/Permission/setup.js](source/node/server/Feature/Permission/setup.js)
  - `setup`
+ 📄 [source/node/server/Feature/ServerFetch/HTML.js](source/node/server/Feature/ServerFetch/HTML.js)
  - `initServerFetch`
+ 📄 [source/node/server/Feature/ServerFetch/responder.js](source/node/server/Feature/ServerFetch/responder.js)
  - `responderServerFetch`
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
+ 📄 [source/node/server/WS/Base.js](source/node/server/WS/Base.js)
  - `createWSBase`
+ 📄 [source/node/server/WS/Client.js](source/node/server/WS/Client.js)
  - `createWSClient`
+ 📄 [source/node/server/WS/Server.js](source/node/server/WS/Server.js)
  - `createUpgradeRequestListener`, `enableWSServer`
+ 📄 [source/node/server/WS/frameDecode.js](source/node/server/WS/frameDecode.js)
  - `createFrameDecodeChip`
+ 📄 [source/node/server/WS/frameEncode.js](source/node/server/WS/frameEncode.js)
  - `createCloseFramePack`, `createFrameEncodeChip`, `encodeBinaryFramePack`, `encodePingFramePack`, `encodePongFramePack`, `encodeTextFramePack`
+ 📄 [source/node/server/WS/function.js](source/node/server/WS/function.js)
  - `BUFFER_MAX_LENGTH`, `FRAME_CONFIG`, `OPCODE_TYPE`, `WEBSOCKET_VERSION`, `applyMaskQuadletBufferInPlace`, `getRequestKey`, `getRespondKey`, `packProtocolList`, `parseProtocolString`
+ 📄 [source/node/system/DefaultOpen.js](source/node/system/DefaultOpen.js)
  - `getDefaultOpenCommandList`
+ 📄 [source/node/system/ExitListener.js](source/node/system/ExitListener.js)
  - `addExitListenerAsync`, `addExitListenerLossyOnce`, `addExitListenerSync`, `clearExitListener`, `deleteExitListenerAsync`, `deleteExitListenerSync`, `guardPromiseEarlyExit`
+ 📄 [source/node/system/Process.js](source/node/system/Process.js)
  - `describeAllProcessStatusAsync`, `findProcessListInfo`, `findProcessPidMapInfo`, `findProcessTreeInfo`, `flattenProcessTree`, `getAllProcessStatusAsync`, `getProcessListAsync`, `isPidExist`, `killProcessInfoAsync`, `killProcessTreeInfoAsync`, `sortProcessList`, `toProcessPidMap`, `toProcessTree`
+ 📄 [source/node/system/ResolveCommand.js](source/node/system/ResolveCommand.js)
  - `resolveCommand`, `resolveCommandAsync`, `resolveCommandName`, `resolveCommandNameAsync`
+ 📄 [source/node/system/Run.js](source/node/system/Run.js)
  - `describeRunOutcome`, `describeRunOutcomeSync`, `run`, `runSync`, `withCwd`
+ 📄 [source/node/system/Status.js](source/node/system/Status.js)
  - `describeSystemActivity`, `describeSystemMemory`, `describeSystemNetwork`, `describeSystemPlatform`, `describeSystemProcessor`, `describeSystemStatus`, `getSystemActivity`, `getSystemMemory`, `getSystemNetwork`, `getSystemPlatform`, `getSystemProcessor`, `getSystemStatus`

#### Export Tree
- **Browser**
  - **Canvas**
    - **Font**
      - `createFontGenerator`, `createFontGeneratorBitmap`, `createFontMapper`, `createFontRender`, `createFontRenderBitmap`
    - **Color**
      - `hexCSSFromRgb`, `hexCSSFromRgba`, `rgbaFromUint32`, `uint32FromRgba`
    - **ImageData**
      - `applyCanvasElementExt`, `applyCanvasImageDataExt`, `applyImageElementExt`, `canvasElementToCanvasImageData`, `canvasImageDataToCanvasElement`, `createCanvasElement`, `createCanvasImageData`, `createImageElement`, `getQuickCanvas`, `getQuickContext2d`, `imageElementToCanvasElement`, `imageElementToCanvasImageData`
    - **ImageDataOperation**
      - `crop`, `drawPixel`, `drawPixelLine`, `drawPixelLineList`, `floodFill`, `getPixelColor`, `replacePixelColor`, `scale`
    - **Function**
      - `loadImage`, `loadText`
  - **Data**
    - **Blob**
      - `Blob`, `parseBlobAsArrayBuffer`, `parseBlobAsDataURL`, `parseBlobAsText`
    - **BlobPacket**
      - `packBlobPacket`, `parseBlobPacket`
  - **Input**
    - **EnhancedEventProcessor**
      - `createSwipeEnhancedEventProcessor`
    - **KeyCommand**
      - `createKeyCommandHub`
    - **PointerEvent**
      - `ENHANCED_POINTER_EVENT_TYPE`, `POINTER_EVENT_TYPE`, `applyEnhancedPointerEventListener`, `applyPointerEventListener`
  - **Module**
    - **FileChunkUpload**
      - `uploadFileByChunk`
    - **HistoryStateStore**
      - `createHistoryStateStore`
    - **LocalStorageStateStore**
      - `createLocalStorageStateStore`
    - **MotionAutoTimer**
      - `createInterpolationAutoTimer`, `createVectorAccumulator`
  - **DOM**
    - `applyReceiveFileListListener`, `createDownload`, `createDownloadWithBlob`, `createDownloadWithObject`, `createDownloadWithString`, `createElement`, `deleteArrayBufferCache`, `getElementAtViewport`, `getPathElementList`, `loadArrayBufferCache`, `saveArrayBufferCache`, `throttleByAnimationFrame`
  - **Net**
    - `fetchLikeRequest`
  - **Resource**
    - `createDownload`, `createDownloadWithBlob`, `createDownloadWithObject`, `createDownloadWithString`, `deleteArrayBufferCache`, `loadArrayBufferCache`, `loadImage`, `loadScript`, `loadText`, `saveArrayBufferCache`
- **Common**
  - **Data**
    - **ArrayBuffer**
      - `calcSHA256ArrayBuffer`, `concatArrayBuffer`, `deconcatArrayBuffer`, `fromNodejsBuffer`, `fromString`, `fromU16String`, `isEqualArrayBuffer`, `toString`, `toU16String`
    - **ArrayBufferPacket**
      - `HEADER_BYTE_SIZE`, `MAX_PACKET_HEADER_SIZE`, `packArrayBufferHeader`, `packArrayBufferPacket`, `packChainArrayBufferPacket`, `parseArrayBufferHeader`, `parseArrayBufferPacket`, `parseChainArrayBufferPacket`
    - **Base64**
      - `decode`, `encode`
    - **CacheMap**
      - `createCache`, `createCacheMap`
    - **DataUri**
      - `decode`, `encode`
    - **Iter**
      - `createLockStepAsyncIter`, `unwrap`, `wrapAsync`, `wrapSync`
    - **LinkedList**
      - `createDoublyLinkedList`, `createNode`
    - **ListMap**
      - `createListMap`
    - **LoopIndex**
      - `createLoopIndex`
    - **MapMap**
      - `createMapMap`, `getInvertMapMap`
    - **SaveQueue**
      - `createSaveQueue`
    - **SetMap**
      - `createSetMap`, `getInvertSetMap`
    - **Toggle**
      - `createToggle`
    - **Tree**
      - `createTreeBottomUpSearch`, `createTreeBottomUpSearchAsync`, `createTreeBreadthFirstSearch`, `createTreeBreadthFirstSearchAsync`, `createTreeDepthFirstSearch`, `createTreeDepthFirstSearchAsync`, `prettyStringifyTreeNode`
    - `dupJSON`, `getValueByKeyList`, `hashStringToNumber`, `reverseString`, `swapObfuscateString`, `tryParseJSONObject`
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
    - **AsyncFuncQueue**
      - `createAsyncFuncQueue`
    - **AsyncLane**
      - `createAsyncLane`, `extendAutoSelectByTagLane`, `extendAutoSelectLane`, `extendLaneValueList`, `extendLaneValueMap`, `selectByTagOrMinLoadLane`, `selectMinLoadLane`
    - **AsyncTask**
      - `ASYNC_TASK_KEY_MAP`, `ASYNC_TASK_PHASE_MAP`, `getAsyncTaskPhase`, `resetAsyncTask`, `runAsyncTask`
    - **AsyncTaskQueue**
      - `ASYNC_TASK_QUEUE_KEY_MAP`, `createAsyncTaskQueue`, `createFilterStaleAsyncTask`
    - **BlockChart**
      - `getBlockBar`, `getBlockChart`
    - **ChunkUpload**
      - `packArrayBufferChunk`, `parseArrayBufferChunk`, `uploadArrayBufferByChunk`
    - **Event**
      - `createEventEmitter`, `createEventTarget`, `createHub`
    - **Exot**
      - `createDummyExot`, `createExotError`, `createExotGroup`, `findExotMapValue`, `isExot`, `mapExotMapValue`, `toExotMap`
    - **HTML**
      - `COMMON_FUNC_MAP`, `COMMON_LAYOUT`, `COMMON_SCRIPT`, `COMMON_STYLE`, `simpleCompactCSS`, `styleTagMerge`
    - **KeySelector**
      - `concatKeyFrag`, `createMultiKeySwitch`, `reduceKeySelector`
    - **KeyTree**
      - `createKeyTree`, `createKeyTreeEnhanced`
    - **LevenshteinDistance**
      - `getLevenshteinDistance`
    - **MIME**
      - `BASIC_EXTENSION_MAP`, `DEFAULT_MIME`, `getMIMETypeFromFileName`
    - **PackageJSON**
      - `collectDependency`, `getFirstBinPath`, `packPackageJSON`, `parsePackageNameAndVersion`, `sortPackageJSON`, `toPackageInfo`, `toPackageTgzName`
    - **Patch**
      - `createPatchKit`, `toArrayWithKeyPatchKit`, `toObjectPatchKit`
    - **RouteMap**
      - `appendRouteMap`, `createRouteMap`, `findRouteFromMap`, `getRouteParam`, `getRouteParamAny`, `parseRouteToMap`, `parseRouteUrl`
    - **Runlet**
      - `ChipSyncBasic`, `END`, `KEY_PEND_INPUT`, `KEY_PEND_OUTPUT`, `KEY_POOL_IO`, `PoolIO`, `REDO`, `SKIP`, `TYPE_LOGICAL_PENDVIEW`, `TYPE_LOGICAL_PENDVIEWEE`, `clearPack`, `createArrayInputChip`, `createArrayOutputChip`, `createAsyncIteratorInputChip`, `createAsyncIteratorOutputChip`, `createCountPool`, `createENDRegulatorChip`, `createLogicalCountPool`, `createPack`, `createRunlet`, `describePack`, `quickConfigPend`, `toChipMap`, `toLinearChipList`, `toPoolMap`
    - **RunletChip**
      - `createArrayInputChip`, `createArrayOutputChip`, `createAsyncIterInputChip`, `createAsyncIterOutputChip`, `createAsyncIteratorInputChip`, `createAsyncIteratorOutputChip`, `createENDRegulatorChip`
    - **SemVer**
      - `compareSemVer`, `isVersionSpecComplex`, `parseSemVer`, `versionBumpByGitBranch`, `versionBumpLastNumber`, `versionBumpToIdentifier`, `versionBumpToLocal`
    - **TimedLookup**
      - `generateCheckCode`, `generateLookupData`, `packCheckCode`, `packDataArrayBuffer`, `parseCheckCode`, `parseDataArrayBuffer`, `verifyCheckCode`, `verifyOption`, `verifyParsedCheckCode`
    - **TimerTag**
      - `calcDate`, `packTimerTag`, `parseTimerTag`
    - **TupleHasherDev**
      - `createTupleHasher`
    - **UpdateLoop**
      - `createUpdateLoop`, `createUpdater`
  - **Mutable**
    - **Object**
      - `objectMergeDeep`, `objectSortKey`
  - **Check**
    - `isArrayBuffer`, `isArrayLength`, `isBasicArray`, `isBasicFunction`, `isBasicObject`, `isBoolean`, `isFunctionThrow`, `isFunctionThrowAsync`, `isInteger`, `isNumber`, `isObjectAlike`, `isObjectContain`, `isObjectKey`, `isOneOf`, `isPromiseAlike`, `isRegExp`, `isStrictEqual`, `isString`, `isStringifyEqual`, `isTruthy`
  - **Compare**
    - `compareString`, `compareStringLocale`, `compareStringWithNumber`
  - **Error**
    - `catchAsync`, `catchPromise`, `catchSync`, `remessageError`, `rethrowError`, `tryCall`
  - **Format**
    - `binary`, `decimal`, `describe`, `mediaTime`, `padTable`, `percent`, `prettyStringifyConfigObject`, `prettyStringifyJSON`, `time`, `typeNameOf`
  - **Function**
    - `createInsideOutPromise`, `debounce`, `lossyAsync`, `once`, `throttle`, `withCache`, `withCacheAsync`, `withDelayArgvQueue`, `withRepeat`, `withRepeatAsync`, `withRetry`, `withRetryAsync`, `withTimeoutAsync`, `withTimeoutPromise`
  - **String**
    - `autoEllipsis`, `createMarkReplacer`, `escapeHTML`, `escapeRegExp`, `filterJoin`, `forEachLine`, `forEachRegExpExec`, `indentLine`, `indentList`, `joinCamelCase`, `joinKebabCase`, `joinSnakeCase`, `lazyEncodeURI`, `removeInvalidCharXML`, `replaceAll`, `splitCamelCase`, `splitKebabCase`, `splitSnakeCase`, `unescapeHTML`
  - **Test**
    - `createTest`
  - **Time**
    - `CLOCK_PER_SECOND`, `CLOCK_TO_SECOND`, `cancelFrameUpdate`, `clock`, `createStepper`, `createTimer`, `getTimestamp`, `requestFrameUpdate`, `setAwaitAsync`, `setTimeoutAsync`, `setWeakInterval`, `setWeakTimeout`
  - **Verify**
    - `arrayBuffer`, `arrayLength`, `basicArray`, `basicFunction`, `basicObject`, `boolean`, `doNotThrow`, `doNotThrowAsync`, `doThrow`, `doThrowAsync`, `includes`, `integer`, `notIncludes`, `notStrictEqual`, `notStringifyEqual`, `number`, `objectAlike`, `objectContain`, `objectKey`, `oneOf`, `promiseAlike`, `regexp`, `strictEqual`, `string`, `stringifyEqual`, `truthy`
- **Env**
  - `assert`, `getEndianness`, `getEnvironment`, `getGlobal`, `tryRequire`, `tryRequireResolve`
- **Node**
  - **Data**
    - **Buffer**
      - `calcHash`, `createBufferRefragPool`, `getRandomBufferAsync`, `toArrayBuffer`
    - **BufferPacket**
      - `packBufferPacket`, `parseBufferPacket`
    - **Stream**
      - `bufferToReadableStream`, `createReadableStreamInputChip`, `createTransformStreamChip`, `createWritableStreamOutputChip`, `isReadableStream`, `isWritableStream`, `quickRunletFromStream`, `readableStreamToBufferAsync`, `readlineOfStreamAsync`, `setupStreamPipe`, `waitStreamStopAsync`, `writeBufferToStreamAsync`
    - **Z64String**
      - `packBr64`, `packGz64`, `unpackBr64`, `unpackGz64`
  - **File**
    - **Directory**
      - `copyDirInfoTree`, `copyDirectory`, `createDirectory`, `deleteDirInfoTree`, `deleteDirectory`, `getDirInfoList`, `getDirInfoTree`, `getFileList`, `getPathTypeFromDirent`, `renameDirInfoTree`, `resetDirectory`, `walkDirInfoTreeAsync`, `walkDirInfoTreeBottomUpAsync`
    - **Modify**
      - `modifyCopy`, `modifyDelete`, `modifyDeleteForce`, `modifyRename`
    - **Path**
      - `PATH_TYPE`, `STAT_ERROR`, `copyPath`, `createPathPrefixLock`, `deletePath`, `dropTrailingSep`, `existPath`, `getPathLstat`, `getPathStat`, `getPathTypeFromStat`, `nearestExistPath`, `renamePath`, `toPosixPath`
    - **Watch**
      - `createFileWatcherExot`
  - **Fs**
    - **Checksum**
      - `describeChecksumInfoList`, `describeChecksumOfPathList`, `getChecksumInfoListOfPath`, `getChecksumInfoListOfPathList`, `getChecksumInfoOfFile`
    - **Directory**
      - `copyDirInfoTree`, `copyDirectory`, `createDirectory`, `deleteDirInfoTree`, `deleteDirectory`, `getDirInfoList`, `getDirInfoTree`, `getFileList`, `getPathTypeFromDirent`, `renameDirInfoTree`, `resetDirectory`, `walkDirInfoTreeAsync`, `walkDirInfoTreeBottomUpAsync`, `withTempDirectory`
    - **File**
      - `appendArrayBuffer`, `appendBuffer`, `appendText`, `editArrayBuffer`, `editBuffer`, `editJSON`, `editJSONPretty`, `editText`, `readArrayBuffer`, `readBuffer`, `readJSON`, `readJSONAlike`, `readText`, `writeArrayBuffer`, `writeBuffer`, `writeJSON`, `writeJSONPretty`, `writeText`
    - **Modify**
      - `modifyCopy`, `modifyDelete`, `modifyDeleteForce`, `modifyRename`
    - **Path**
      - `PATH_TYPE`, `STAT_ERROR`, `addTrailingSep`, `copyPath`, `createPathPrefixLock`, `deletePath`, `deletePathForce`, `dropTrailingSep`, `existPath`, `expandHome`, `getPathLstat`, `getPathStat`, `getPathTypeFromStat`, `nearestExistPath`, `renamePath`, `resolveHome`, `toPosixPath`
    - **Watch**
      - `createFileWatcherExot`
  - **Module**
    - **ActionJSON**
      - `ACTION_CORE_MAP`, `ACTION_TYPE`, `setupActionMap`, `ACTION_CORE_MAP`, `ACTION_TYPE`, `ACTION_CORE_MAP`, `ACTION_TYPE`, `setupActionMap`
    - **Archive**
      - `check`, `compressArgs`, `extractArgs`, `getArgs`, `setArgs`, `verify`, `REGEXP_AUTO`, `check`, `compress7zAsync`, `compressAutoAsync`, `compressT7zAsync`, `extract7zAsync`, `extractAutoAsync`, `extractT7zAsync`, `repackAsync`, `repackTarAsync`, `verify`, `REGEXP_FSP`, `compressAsync`, `compressFspAsync`, `compressFspGzBrAsync`, `extractAsync`, `extractFspAsync`, `extractFspGzBrAsync`, `REGEXP_BR`, `REGEXP_GZ`, `REGEXP_GZBR`, `REGEXP_T7Z`, `REGEXP_TBR`, `REGEXP_TGZ`, `REGEXP_TXZ`, `compressGzBrFileAsync`, `createBrotliCompressMax`, `createGzipMax`, `extractGzBrFileAsync`, `isBufferGzip`, `isFileGzip`, `withTempPath`, `REGEXP_NPM_TAR`, `check`, `compressAsync`, `createCompressStream`, `createExtractStream`, `extractAsync`, `extractPackageJSON`, `extractPackageJson`, `getNpmTar`, `verify`, `check`, `compressArgs`, `extractArgs`, `getArgs`, `setArgs`, `verify`
    - **Option**
      - `createOptionParser`, `Preset`, `createOptionGetter`, `getOptionalFormatFlag`, `getOptionalFormatValue`, `parseOptionMap`, `prepareOption`
    - **Software**
      - `catStringToFileCommand`, `check`, `commonBashArgList`, `commonCommandList`, `commonSourceProfileCommandList`, `getArgs`, `gitCleanUpCommandList`, `gitFetchBranchCommandList`, `joinCommand`, `runBash`, `runBashCommand`, `runBashCommandSync`, `runBashStdout`, `runBashStdoutSync`, `runBashSync`, `setArgs`, `subShellCommandList`, `toHeredocNoMagic`, `verify`, `check`, `checkCompose`, `checkLocalImage`, `checkPullImage`, `getArgs`, `getArgsCompose`, `getContainerLsList`, `matchContainerLsList`, `patchContainerLsListStartedAt`, `pullImage`, `runCompose`, `runComposeStdout`, `runComposeStdoutSync`, `runComposeSync`, `runDocker`, `runDockerStdout`, `runDockerStdoutSync`, `runDockerSync`, `setArgs`, `setArgsCompose`, `verify`, `verifyCompose`, `check`, `getArgs`, `getGitBranch`, `getGitCommitHash`, `getGitCommitMessage`, `runGit`, `runGitStdout`, `runGitStdoutSync`, `runGitSync`, `setArgs`, `verify`, `COMMON_HOST_STATUS_COMMAND_LIST`, `getCommonHostStatus`, `fetchLikeRequestWithProxy`, `fetchWithJumpProxy`, `findUpPackageRoot`, `fromGlobalNodeModules`, `fromNpmNodeModules`, `getPathNpm`, `getPathNpmExecutable`, `getPathNpmGlobalRoot`, `getSudoArgs`, `hasRepoVersion`, `parsePackageNameAndVersion`, `runNpm`, `runNpmStdout`, `runNpmStdoutSync`, `runNpmSync`, `runSudoNpm`, `runSudoNpmStdout`, `runSudoNpmStdoutSync`, `runSudoNpmSync`, `toPackageTgzName`
    - **Auth**
      - `AUTH_FILE`, `AUTH_FILE_GROUP`, `AUTH_SKIP`, `DEFAULT_AUTH_KEY`, `configureAuth`, `configureAuthFile`, `configureAuthFileGroup`, `configureAuthSkip`, `describeAuthFile`, `generateAuthCheckCode`, `generateAuthFile`, `loadAuthFile`, `saveAuthFile`, `verifyAuthCheckCode`
    - **EntityTag**
      - `getEntityTagByContentHash`, `getEntityTagByContentHashAsync`, `getWeakEntityTagByStat`
    - **FactDatabase**
      - `INITIAL_FACT_INFO`, `createFactDatabaseExot`, `tryDeleteExtraCache`, `tryLoadFactInfo`
    - **FileChunkUpload**
      - `createOnFileChunkUpload`, `uploadFileByChunk`
    - **FsPack**
      - `TYPE_DIRECTORY`, `TYPE_FILE`, `TYPE_SYMLINK`, `append`, `appendContentList`, `appendDirectory`, `appendFile`, `appendFromPath`, `appendSymlink`, `initFsPack`, `loadFsPack`, `saveFsPack`, `setFsPackPackRoot`, `setFsPackUnpackPath`, `unpack`, `unpackContentList`, `unpackDirectory`, `unpackFile`, `unpackSymlink`, `unpackToPath`
    - **Log**
      - `configureLog`
    - **Logger**
      - `createLoggerExot`, `createSimpleLoggerExot`
    - **PackageJSON**
      - `editPackageJSON`, `loadPackageCombo`, `loadPackageInfo`, `loadPackageInfoList`, `savePackageInfo`, `toPackageJSONPath`, `toPackageRootPath`, `writePackageJSON`
    - **Permission**
      - `configurePermission`
    - **Pid**
      - `configurePid`
    - **PingRace**
      - `PING_STAT_ERROR`, `pingRaceUrlList`, `pingStatUrlList`
    - **RuntimeDump**
      - `dumpAsync`, `getV8Extra`, `getV8HeapSnapshotReadableStream`, `setupSIGUSR2`, `writeV8HeapSnapshot`
    - **SafeWrite**
      - `createSafeWriteStream`
    - **TerminalColor**
      - `configureTerminalColor`
    - **TerminalStatusBar**
      - `createStatusBar`
    - **Function**
      - `createArgListPack`, `probeSync`, `spawnString`
  - **Server**
    - **Feature**
      - **@**
        - **HTML**
          - **LoadingMask**
            - `initLoadingMask`
          - **Modal**
            - `initModal`
        - **Configure**
          - `configureFeature`, `configureServerExot`, `runServer`, `runServerExotGroup`, `setupServerExotGroup`
        - **Option**
          - `LogFormatConfig`, `PidFormatConfig`, `getLogOption`, `getPidOption`, `getServerExotFormatConfig`, `getServerExotOption`
      - **ActionJSON**
        - `actionJSON`, `actionJson`, `PERMISSION_CHECK_ACTION_JSON`, `PERMISSION_CHECK_ACTION_JSON_PUBLIC`, `setup`
      - **Auth**
        - **HTML**
          - `initAuthMask`
        - `AuthCommonFormatConfig`, `AuthFileFormatConfig`, `AuthFileGroupFormatConfig`, `AuthSkipFormatConfig`, `getAuthCommonOption`, `getAuthFileGroupOption`, `getAuthFileOption`, `getAuthSkipOption`, `setup`
      - **Explorer**
        - **HTML**
          - `getHTML`, `initPathContent`, `pathContentStyle`, `initUploader`
        - **Option**
          - `ExplorerFormatConfig`, `getExplorerOption`
        - **Setup**
          - `setup`
      - **File**
        - `fileDownload`, `fileUpload`, `FileFormatConfig`, `getFileOption`, `createResponderFileChunkUpload`, `createResponderServeFile`, `PERMISSION_CHECK_FILE_UPLOAD_START`, `setup`
      - **Permission**
        - `PermissionFormatConfig`, `getPermissionOption`, `setup`
      - **ServerFetch**
        - **HTML**
          - `initServerFetch`
        - `responderServerFetch`
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
    - **WS**
      - **Base**
        - `createWSBase`
      - **Client**
        - `createWSClient`
      - **Server**
        - `createUpgradeRequestListener`, `enableWSServer`
      - `createFrameDecodeChip`, `createCloseFramePack`, `createFrameEncodeChip`, `encodeBinaryFramePack`, `encodePingFramePack`, `encodePongFramePack`, `encodeTextFramePack`, `BUFFER_MAX_LENGTH`, `FRAME_CONFIG`, `OPCODE_TYPE`, `WEBSOCKET_VERSION`, `applyMaskQuadletBufferInPlace`, `getRequestKey`, `getRespondKey`, `packProtocolList`, `parseProtocolString`
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
      - `createRequestListener`, `createServerExot`, `describeServerOption`
    - **CommonHTML**
      - `COMMON_FUNC_MAP`, `COMMON_LAYOUT`, `COMMON_SCRIPT`, `COMMON_STYLE`, `DR_BROWSER_FILE_PATH`, `DR_BROWSER_SCRIPT_TAG`, `simpleCompactCSS`, `styleTagMerge`
    - **Function**
      - `DR_BROWSER_FILE_PATH`, `DR_BROWSER_SCRIPT_TAG`, `autoTestServerPort`, `getRequestBuffer`, `getRequestJSON`, `getRequestParam`, `getUnusedPort`, `getWSProtocolListParam`, `isPrivateAddress`, `packWSProtocolListParam`, `parseCookieString`, `parseHostString`
  - **System**
    - **DefaultOpen**
      - `getDefaultOpenCommandList`
    - **ExitListener**
      - `addExitListenerAsync`, `addExitListenerLossyOnce`, `addExitListenerSync`, `clearExitListener`, `deleteExitListenerAsync`, `deleteExitListenerSync`, `guardPromiseEarlyExit`
    - **Process**
      - `describeAllProcessStatusAsync`, `findProcessListInfo`, `findProcessPidMapInfo`, `findProcessTreeInfo`, `flattenProcessTree`, `getAllProcessStatusAsync`, `getProcessListAsync`, `isPidExist`, `killProcessInfoAsync`, `killProcessTreeInfoAsync`, `sortProcessList`, `toProcessPidMap`, `toProcessTree`
    - **ResolveCommand**
      - `resolveCommand`, `resolveCommandAsync`, `resolveCommandName`, `resolveCommandNameAsync`
    - **Run**
      - `describeRunOutcome`, `describeRunOutcomeSync`, `run`, `runSync`, `withCwd`
    - **Status**
      - `describeSystemActivity`, `describeSystemMemory`, `describeSystemNetwork`, `describeSystemPlatform`, `describeSystemProcessor`, `describeSystemStatus`, `getSystemActivity`, `getSystemMemory`, `getSystemNetwork`, `getSystemPlatform`, `getSystemProcessor`, `getSystemStatus`
  - **Kit**
    - `argvFlag`, `getKit`, `getKitLogger`, `getKitPathCombo`, `getKitRun`, `loadEnvKey`, `runKit`, `saveEnvKey`, `syncEnvKey`
  - **Net**
    - `fetchLikeRequest`, `fetchWithJump`, `ping`, `requestHttp`
  - **Resource**
    - `DR_BROWSER_FILE_PATH`, `DR_BROWSER_SCRIPT_TAG`, `loadJSON`, `loadLocalJSON`, `loadLocalScript`, `loadRemoteJSON`, `loadRemoteScript`, `loadScript`
  - **Run**
    - `describeRunOutcome`, `describeRunOutcomeSync`, `run`, `runDetached`, `runStdout`, `runStdoutSync`, `runSync`

#### Bin Option Format
📄 [source-bin/option.js](source-bin/option.js)
> ```
> CLI Usage:
>   --config --c -c [OPTIONAL] [ARGUMENT=1]
>       from JS/JSON: set to "path/to/config.js|json"
>       from ENV: set to "env" to enable, default not check env
>       from ENV JSON: set to "json-env:ENV_NAME" to read the ENV string as JSON, or "jz64/jb64-env"
>       from CLI JSON: set to "json-cli:JSON_STRING" to read the appended string as JSON, or "jz64/jb64-cli"
>   --help --h -h [OPTIONAL] [ARGUMENT=0-1]
>       show full help
>   --version --v -v [OPTIONAL] [ARGUMENT=0-1]
>       show version
>   --note --N -N [OPTIONAL] [ARGUMENT=1+]
>       noop, tag for ps/htop
>   --quiet --q -q [OPTIONAL] [ARGUMENT=0-1]
>       less log
>   --input-file --I -I [OPTIONAL] [ARGUMENT=1]
>       common option
>   --output-file --O -O [OPTIONAL] [ARGUMENT=1]
>       common option
>   --pid-file --pid [OPTIONAL] [ARGUMENT=1]
>       common option
>   --host --H -H [OPTIONAL] [ARGUMENT=1]
>       common option: $0=hostname:port (hostname default to 0.0.0.0)
>   --route-prefix --RP [OPTIONAL] [ARGUMENT=1]
>       common option: $0=routePrefix (default to "", set like "/prefix")
>   --root --R -R [OPTIONAL] [ARGUMENT=1]
>       common option: $0=path/cwd
>   --json --J -J [OPTIONAL] [ARGUMENT=0-1]
>       output JSON, if supported
>   --eval --e -e [OPTIONAL] [ARGUMENT=0+]
>       eval file or string: -O=outputFile, -I/$0=scriptFile/scriptString, $@=...evalArgv
>   --repl --i -i [OPTIONAL] [ARGUMENT=0-1]
>       start node REPL
>   --fetch --f -f [OPTIONAL] [ARGUMENT=1-4]
>       fetch url with http_proxy env support: -I=requestBody/null, -O=outputFile/stdout, $@=initialUrl,method/GET,jumpMax/4,timeout/0
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
>   --status --s -s [OPTIONAL] [ARGUMENT=0-1]
>       basic system status: -J=isOutputJSON
>   --open --o -o [OPTIONAL] [ARGUMENT=0-2]
>       use system default app to open uri or path: $0=uriOrPath/cwd, $1=isDetached/false
>   --which --w -w [OPTIONAL] [ARGUMENT=1]
>       resolve to full executable path: -R=resolveRoot/cwd, $0=commandNameOrPath
>   --run [OPTIONAL] [ARGUMENT=0+]
>       run command: $0=...argsList
>   --detach --bg [OPTIONAL] [ARGUMENT=0+]
>       run command detached: -O=logFile/ignore, $0=...argsList
>   --process-status --ps [OPTIONAL] [ARGUMENT=0-1]
>       show system process status: -J=isOutputJSON, $0=outputMode/"pid--"
>   --process-signal --sig [OPTIONAL] [ARGUMENT=0-2]
>       send signal to process by pid: -I=pidFile $@=pid/pidFile,signal/"SIGTERM"
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
>     export DR_JS_HELP="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_VERSION="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_NOTE="[OPTIONAL] [ARGUMENT=1+]"
>     export DR_JS_QUIET="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_INPUT_FILE="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_OUTPUT_FILE="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_PID_FILE="[OPTIONAL] [ARGUMENT=1] [ALIAS=DR_JS_PID]"
>     export DR_JS_HOST="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_ROUTE_PREFIX="[OPTIONAL] [ARGUMENT=1] [ALIAS=DR_JS_RP]"
>     export DR_JS_ROOT="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_JSON="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_EVAL="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_REPL="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_FETCH="[OPTIONAL] [ARGUMENT=1-4]"
>     export DR_JS_WAIT="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_ECHO="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_CAT="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_WRITE="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_APPEND="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_MERGE="[OPTIONAL] [ARGUMENT=2+]"
>     export DR_JS_CREATE_DIRECTORY="[OPTIONAL] [ARGUMENT=0+] [ALIAS=DR_JS_MKDIR]"
>     export DR_JS_MODIFY_COPY="[OPTIONAL] [ARGUMENT=2] [ALIAS=DR_JS_CP]"
>     export DR_JS_MODIFY_RENAME="[OPTIONAL] [ARGUMENT=2] [ALIAS=DR_JS_MV]"
>     export DR_JS_MODIFY_DELETE="[OPTIONAL] [ARGUMENT=0+] [ALIAS=DR_JS_RM]"
>     export DR_JS_STATUS="[OPTIONAL] [ARGUMENT=0-1]"
>     export DR_JS_OPEN="[OPTIONAL] [ARGUMENT=0-2]"
>     export DR_JS_WHICH="[OPTIONAL] [ARGUMENT=1]"
>     export DR_JS_RUN="[OPTIONAL] [ARGUMENT=0+]"
>     export DR_JS_DETACH="[OPTIONAL] [ARGUMENT=0+] [ALIAS=DR_JS_BG]"
>     export DR_JS_PROCESS_STATUS="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_PS]"
>     export DR_JS_PROCESS_SIGNAL="[OPTIONAL] [ARGUMENT=0-2] [ALIAS=DR_JS_SIG]"
>     export DR_JS_JSON_FORMAT="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_JF]"
>     export DR_JS_SERVER_SERVE_STATIC="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_SSS]"
>     export DR_JS_SERVER_SERVE_STATIC_SIMPLE="[OPTIONAL] [ARGUMENT=0-1] [ALIAS=DR_JS_SSSS]"
>     export DR_JS_SERVER_WEBSOCKET_GROUP="[OPTIONAL] [ALIAS=DR_JS_SWG]"
>     export DR_JS_SERVER_TEST_CONNECTION="[OPTIONAL] [ALIAS=DR_JS_STC]"
>     export DR_JS_SERVER_TCP_PROXY="[OPTIONAL] [ARGUMENT=1+] [ALIAS=DR_JS_STP]"
>   "
> CONFIG Usage:
>   {
>     "config": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "help": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "version": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "note": [ "[OPTIONAL] [ARGUMENT=1+]" ],
>     "quiet": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "inputFile": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "outputFile": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "pidFile": [ "[OPTIONAL] [ARGUMENT=1] [ALIAS=pid]" ],
>     "host": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "routePrefix": [ "[OPTIONAL] [ARGUMENT=1] [ALIAS=RP]" ],
>     "root": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "json": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "eval": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "repl": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "fetch": [ "[OPTIONAL] [ARGUMENT=1-4]" ],
>     "wait": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "echo": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "cat": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "write": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "append": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "merge": [ "[OPTIONAL] [ARGUMENT=2+]" ],
>     "createDirectory": [ "[OPTIONAL] [ARGUMENT=0+] [ALIAS=mkdir]" ],
>     "modifyCopy": [ "[OPTIONAL] [ARGUMENT=2] [ALIAS=cp]" ],
>     "modifyRename": [ "[OPTIONAL] [ARGUMENT=2] [ALIAS=mv]" ],
>     "modifyDelete": [ "[OPTIONAL] [ARGUMENT=0+] [ALIAS=rm]" ],
>     "status": [ "[OPTIONAL] [ARGUMENT=0-1]" ],
>     "open": [ "[OPTIONAL] [ARGUMENT=0-2]" ],
>     "which": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "run": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "detach": [ "[OPTIONAL] [ARGUMENT=0+] [ALIAS=bg]" ],
>     "processStatus": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=ps]" ],
>     "processSignal": [ "[OPTIONAL] [ARGUMENT=0-2] [ALIAS=sig]" ],
>     "jsonFormat": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=jf]" ],
>     "serverServeStatic": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=sss]" ],
>     "serverServeStaticSimple": [ "[OPTIONAL] [ARGUMENT=0-1] [ALIAS=ssss]" ],
>     "serverWebsocketGroup": [ "[OPTIONAL] [ALIAS=swg]" ],
>     "serverTestConnection": [ "[OPTIONAL] [ALIAS=stc]" ],
>     "serverTcpProxy": [ "[OPTIONAL] [ARGUMENT=1+] [ALIAS=stp]" ],
>   }
> ```
