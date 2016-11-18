/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(9);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	var _config = __webpack_require__(2);

	var _config2 = _interopRequireDefault(_config);

	var _common = __webpack_require__(7);

	var _common2 = _interopRequireDefault(_common);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var Dr = _config2.default.GLOBAL.Dr = _extends({}, _config2.default, _common2.default, {

	  // the lower level the fewer & important message is printed
	  // normally: 5 - ALL, 10 - WARN, 15+ - CUSTOM DEBUG LEVEL
	  debugLevel: 0,
	  log: function log() {
	    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    return _common2.default.logList(args);
	  },
	  debug: function debug(debugLevel) {
	    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	      args[_key2 - 1] = arguments[_key2];
	    }

	    return Dr.debugLevel && Dr.debugLevel <= debugLevel && _common2.default.logList(args);
	  },
	  assert: function assert() {
	    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	      args[_key3] = arguments[_key3];
	    }

	    Dr.debugLevel > 15 && _common2.default.logList(['[' + Dr.now().toFixed(4) + 'sec]', '[assert]'].concat(args));
	    _common2.default.assertList(args);
	  },
	  logError: function logError(error) {
	    for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
	      args[_key4 - 1] = arguments[_key4];
	    }

	    _common2.default.logList(['Error', error]);
	    _common2.default.logList([].concat(args));
	    error.stack && _common2.default.logList([error.stack]);
	  },

	  toggle: new _common2.default.Toggle()
	});

	exports.default = Dr;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	exports.loadScriptByList = loadScriptByList;
	var GLOBAL = exports.GLOBAL = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : undefined; // normally window, global or this for a sandbox?
	var ENVIRONMENT = exports.ENVIRONMENT = function () {
	  var isBrowser = typeof GLOBAL.window !== 'undefined' && typeof GLOBAL.document !== 'undefined';
	  var isNode = typeof GLOBAL.process !== 'undefined' && typeof GLOBAL.process.versions !== 'undefined' && GLOBAL.process.versions.node;
	  var isCordova = typeof GLOBAL.cordova !== 'undefined';
	  return isCordova ? 'cordova' : isNode ? 'node' : isBrowser ? 'browser' : 'unknown';
	}();

	console.log('detected', ENVIRONMENT);

	// ENVIRONMENT dependent

	var _ref = function () {
	  var _ret = function () {
	    switch (ENVIRONMENT) {
	      case 'browser':
	      case 'cordova':
	        return {
	          v: {
	            loadScript: function loadScript(src) {
	              return new Promise(function (resolve) {
	                var element = document.createElement('script');
	                element.type = 'text/javascript';
	                element.async = false;
	                element.src = src;
	                element.onload = function () {
	                  return resolve(element);
	                };
	                var existElement = document.getElementsByTagName('script')[0];
	                existElement.parentNode.insertBefore(element, existElement);
	              });
	            }
	          }
	        };
	      case 'node':
	        var nodeModuleFs = __webpack_require__(3);
	        var nodeModuleVm = __webpack_require__(4);
	        var nodeModulePath = __webpack_require__(5);
	        var nodeModuleRepl = __webpack_require__(6);
	        return {
	          v: {
	            nodeExePath: GLOBAL.process.argv[0],
	            nodeStartScriptPath: nodeModulePath.resolve(GLOBAL.process.cwd(), nodeModulePath.dirname(GLOBAL.process.argv[1])),
	            getLocalPath: function getLocalPath(relativePath) {
	              return nodeModulePath.resolve(nodeStartScriptPath, relativePath);
	            },
	            startREPL: function startREPL() {
	              return nodeModuleRepl.start({
	                prompt: 'Dr> ',
	                input: GLOBAL.process.stdin,
	                output: GLOBAL.process.stdout,
	                useGlobal: true
	              });
	            },

	            loadScript: function loadScript(src) {
	              return new Promise(function (resolve, reject) {
	                if (src.search('://') !== -1) return console.log(['[loadScript] not support web content yet...', src]);
	                var localPath = getLocalPath(src);
	                try {
	                  nodeModuleFs.readFile(localPath, function (error, data) {
	                    if (error) throw error;
	                    if (!data) throw new Error('failed to read file data:' + data);
	                    nodeModuleVm.runInThisContext(data.toString(), { filename: localPath });
	                    resolve(data);
	                  });
	                } catch (error) {
	                  reject(error);
	                }
	              });
	            }
	          }
	        };
	    }
	  }();

	  if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	}(),
	    loadScript = _ref.loadScript,
	    nodeExePath = _ref.nodeExePath,
	    nodeStartScriptPath = _ref.nodeStartScriptPath,
	    getLocalPath = _ref.getLocalPath,
	    startREPL = _ref.startREPL;

	exports.loadScript = loadScript;
	exports.nodeExePath = nodeExePath;
	exports.nodeStartScriptPath = nodeStartScriptPath;
	exports.getLocalPath = getLocalPath;
	exports.startREPL = startREPL;
	function loadScriptByList(srcList) {
	  var loopLoad = function loopLoad() {
	    return new Promise(function (resolve) {
	      return srcList.length <= 0 ? resolve() : loadScript(srcList.shift()).then(loopLoad);
	    });
	  };
	  return loopLoad(); // start loop
	}

	var onNextProperUpdate = exports.onNextProperUpdate = GLOBAL.requestAnimationFrame ? GLOBAL.requestAnimationFrame : function (callback) {
	  return setTimeout(callback, 1000 / 60);
	};

	exports.default = {
	  GLOBAL: GLOBAL,
	  ENVIRONMENT: ENVIRONMENT,

	  loadScript: loadScript,
	  loadScriptByList: loadScriptByList,
	  onNextProperUpdate: onNextProperUpdate,

	  nodeExePath: nodeExePath,
	  nodeStartScriptPath: nodeStartScriptPath,
	  getLocalPath: getLocalPath,
	  startREPL: startREPL
	};

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("fs");

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = require("vm");

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("path");

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = require("repl");

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	var _utils = __webpack_require__(8);

	var Utils = _interopRequireWildcard(_utils);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	exports.default = _extends({}, Utils);

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.UpdateLoop = exports.Event = exports.startClock = exports.startTimestamp = exports.clockPerSec = exports.generateId = exports.assertList = exports.logList = exports.getArgumentArray = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	exports.getRandomInt = getRandomInt;
	exports.getRandomIntMulti = getRandomIntMulti;
	exports.pick = pick;
	exports.reverseKeyValue = reverseKeyValue;
	exports.arrayDeduplication = arrayDeduplication;
	exports.getUTCTimeStamp = getUTCTimeStamp;
	exports.clock = clock;
	exports.now = now;
	exports.delay = delay;
	exports.loop = loop;
	exports.Toggle = Toggle;

	var _config = __webpack_require__(2);

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var getArgumentArray = exports.getArgumentArray = function getArgumentArray(args) {
	  var omitCount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
	  return Array.prototype.slice.call(args, omitCount);
	};
	var logList = exports.logList = console.log.apply ? function (argList) {
	  return console.log.apply(console, argList);
	} : function (argList) {
	  return console.log(argList);
	};
	var assertList = exports.assertList = console.assert.apply ? function (argList) {
	  return console.assert.apply(console, argList);
	} : function (assertion) {
	  for (var _len = arguments.length, argList = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	    argList[_key - 1] = arguments[_key];
	  }

	  if (!assertion) throw new Error(argList);
	};

	// math related
	function __getRandomInt(from, to) {
	  // this will not auto swap, meaning <from> should be smaller than <to>
	  return Math.floor(Math.random() * (to - from + 1) + from); // range [from, to]
	}

	function getRandomInt(a) {
	  var b = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
	  return __getRandomInt(Math.min(a, b), Math.max(a, b));
	}
	function getRandomIntMulti(a, b, count) {
	  // the result will be from small to big
	  var from = Math.min(a, b);
	  var to = Math.max(a, b);
	  var resultList = [];
	  count = Math.min(count, to - from + 1);
	  for (var i = 0; i < count; i++) {
	    var next = __getRandomInt(from, to - i);
	    var j = 0;
	    while (j < resultList.length) {
	      if (resultList[j] > next) break;
	      next++;
	      j++;
	    }
	    resultList.splice(j, 0, next);
	  }
	  return resultList;
	}

	// data operation
	function pick(pack, key) {
	  var pickData = void 0;
	  if (pack instanceof Object) {
	    pickData = pack[key];
	    delete pack[key];
	  }
	  return pickData;
	}
	function reverseKeyValue(pack, maskValue) {
	  var resultMap = {};
	  if (maskValue) for (var key in pack) {
	    resultMap[pack[key]] = maskValue;
	  } else for (var _key2 in pack) {
	    resultMap[pack[_key2]] = _key2;
	  }return resultMap;
	}
	function arrayDeduplication() {
	  var dedupMap = {};

	  for (var _len2 = arguments.length, arrayList = Array(_len2), _key3 = 0; _key3 < _len2; _key3++) {
	    arrayList[_key3] = arguments[_key3];
	  }

	  for (var i in arrayList) {
	    var array = arrayList[i];
	    for (var j in array) {
	      dedupMap[array[j]] = true;
	    }
	  }
	  var result = [];
	  for (var key in dedupMap) {
	    result.push(key);
	  }return result;
	}
	var generateId = exports.generateId = function () {
	  // const symbolList = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); //full 62
	  var symbolList = '0123456789ACEFGHJKLMNPQRSTUVWXYZ'.split(''); // lite 32, easy to recognise, but only safe within one runtime
	  var symbolCount = symbolList.length;
	  var resultCount = 20;
	  var indexList = [];
	  var resultList = [];
	  for (var i = 0; i < resultCount; i++) {
	    indexList[i] = 0;
	    resultList[i] = symbolList[indexList[i]];
	  }
	  return function () {
	    for (var _i = resultCount - 1; _i >= 0; _i--) {
	      indexList[_i] = (indexList[_i] + 1) % symbolCount;
	      resultList[_i] = symbolList[indexList[_i]];
	      if (indexList[_i] > 0) break;
	    }
	    return resultList.join(''); // get string
	  };
	}();

	// time related
	var clockPerSec = exports.clockPerSec = 1000;
	function getUTCTimeStamp() {
	  return Math.floor(Date.now() / clockPerSec);
	}
	var startTimestamp = exports.startTimestamp = getUTCTimeStamp();
	var startClock = exports.startClock = Date.now();
	function clock() {
	  return Date.now() - startClock; // return running time in milliseconds
	}
	function now() {
	  return (Date.now() - startClock) / clockPerSec; // return running time in seconds
	}
	function delay(callback, time, isRepeat) {
	  var setFunc = isRepeat ? setInterval : setTimeout;
	  var clearFunc = isRepeat ? clearInterval : clearTimeout;
	  var clearId = setFunc(callback, time * 1000);
	  return function () {
	    return clearFunc(clearId);
	  }; // can be called to remove callback
	}

	// logic
	function loop(count, callback) {
	  var looped = 0;
	  while (count > looped) {
	    callback(looped);
	    looped++;
	  }
	}

	var Event = exports.Event = function () {
	  function Event() {
	    _classCallCheck(this, Event);

	    this.eventMap = new Map();
	  }

	  _createClass(Event, [{
	    key: 'emit',
	    value: function emit(key) {
	      var callbackList = this.getListenerList(key);
	      if (callbackList) for (var i in callbackList) {
	        callbackList[i].apply(null, arguments);
	      }
	    }
	  }, {
	    key: 'addEventListener',
	    value: function addEventListener(key, callback) {
	      if (!callback || typeof callback === 'function') throw new Error('invalid callback');
	      var callbackList = this.getListenerList(key);
	      for (var i in callbackList) {
	        if (callbackList[i] === callback) throw new Error('callback already exist');
	      }callbackList.push(callback);
	      return key;
	    }
	  }, {
	    key: 'removeEventListener',
	    value: function removeEventListener(key, callback) {
	      var callbackList = this.getListenerList(key);
	      for (var i in callbackList) {
	        if (callbackList[i] === callback) {
	          callbackList.splice(i, 1);
	          return callback;
	        }
	      }
	      return null;
	    }
	  }, {
	    key: 'removeEventKey',
	    value: function removeEventKey(key) {
	      this.eventMap.delete(key);
	    }
	  }, {
	    key: 'removeAll',
	    value: function removeAll() {
	      this.eventMap.clear();
	    }
	  }, {
	    key: 'getListenerList',
	    value: function getListenerList(key) {
	      if (!this.eventMap.has(key)) this.eventMap.set(key, []);
	      return this.eventMap.get(key);
	    }
	  }]);

	  return Event;
	}();

	var UpdateLoop = exports.UpdateLoop = function () {
	  function UpdateLoop() {
	    _classCallCheck(this, UpdateLoop);

	    this.lastUpdateTime = now();
	    this.isActive = false;
	    this.clear();
	    // bind first
	    this.update = this.update().bind(this);
	  }

	  _createClass(UpdateLoop, [{
	    key: 'start',
	    value: function start() {
	      this.isActive = true;
	      (0, _config.onNextProperUpdate)(this.update);
	    }
	  }, {
	    key: 'stop',
	    value: function stop() {
	      this.isActive = false;
	    }
	  }, {
	    key: 'clear',
	    value: function clear() {
	      this.updateFuncList = []; // index non-constant, will be refreshed on every update
	      this.updateFuncMap = new Map(); // key constant, will be refreshed on every update
	    }
	  }, {
	    key: 'add',
	    value: function add(updateFunc, key) {
	      key ? this.updateFuncMap.set(key, updateFunc) : this.updateFuncList.push(updateFunc);
	    }
	  }, {
	    key: 'update',
	    value: function update() {
	      var currentUpdateTime = now();
	      var deltaTime = currentUpdateTime - this.lastUpdateTime;
	      this.lastUpdateTime = currentUpdateTime;

	      var nextUpdateFuncList = [];
	      this.updateFuncList.forEach(function (index, updateFunc) {
	        return updateFunc(deltaTime) && nextUpdateFuncList.push(updateFunc);
	      });
	      this.updateFuncList = nextUpdateFuncList;

	      var nextUpdateFuncMap = new Map();
	      this.updateFuncMap.forEach(function (key, updateFunc) {
	        return updateFunc(deltaTime) && nextUpdateFuncMap.set(key, updateFunc);
	      });
	      this.updateFuncMap = nextUpdateFuncMap;

	      this.isActive && (0, _config.onNextProperUpdate)(this.update);
	    }
	  }]);

	  return UpdateLoop;
	}();

	function Toggle() {
	  var toggle = function toggle(key, value) {
	    if (value === undefined) value = !toggle[key];
	    toggle[key] = value;
	    return value;
	  };
	  return toggle;
	}

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _Dr = __webpack_require__(1);

	var _Dr2 = _interopRequireDefault(_Dr);

	var _node = __webpack_require__(10);

	var _node2 = _interopRequireDefault(_node);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	Object.assign(_Dr2.default, _node2.default);

	_Dr2.default.GLOBAL.Dr = _Dr2.default;

	exports.default = _Dr2.default;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	var _utils = __webpack_require__(11);

	var Utils = _interopRequireWildcard(_utils);

	var _ArgvParser = __webpack_require__(12);

	var _ArgvParser2 = _interopRequireDefault(_ArgvParser);

	var _Command = __webpack_require__(13);

	var _Command2 = _interopRequireDefault(_Command);

	var _FileOperation = __webpack_require__(16);

	var _FileOperation2 = _interopRequireDefault(_FileOperation);

	var _DirectoryOperation = __webpack_require__(17);

	var _DirectoryOperation2 = _interopRequireDefault(_DirectoryOperation);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	exports.default = _extends({}, Utils, {
	  ArgvParser: _ArgvParser2.default,
	  Command: _Command2.default,
	  FileOperation: _FileOperation2.default,
	  DirectoryOperation: _DirectoryOperation2.default
	});

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.loadScriptSync = loadScriptSync;
	exports.loadJSONSync = loadJSONSync;

	var _Dr = __webpack_require__(1);

	var _Dr2 = _interopRequireDefault(_Dr);

	var _vm = __webpack_require__(4);

	var _vm2 = _interopRequireDefault(_vm);

	var _fs = __webpack_require__(3);

	var _fs2 = _interopRequireDefault(_fs);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function loadScriptSync(src) {
	  var filePath = _Dr2.default.getLocalPath(src);
	  try {
	    var data = _fs2.default.readFileSync(filePath);
	    _vm2.default.runInThisContext(data.toString(), { filename: filePath });
	  } catch (error) {
	    _Dr2.default.logError(error, '[loadScript] Failed to load Script', filePath);
	  }
	}

	function loadJSONSync(src) {
	  var filePath = _Dr2.default.getLocalPath(src);
	  var fileString = _fs2.default.readFileSync(filePath, { encoding: 'utf8' });
	  var stringList = fileString.split('\n').forEach(function (v) {
	    return v.replace(/\/\/.*/, '');
	  }); // support single line comment like '//...'
	  return JSON.parse(stringList.join('\n'));
	}

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _Dr = __webpack_require__(1);

	var _Dr2 = _interopRequireDefault(_Dr);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var ArgvParser = function () {
	  function ArgvParser(formatListList) {
	    var _this = this;

	    _classCallCheck(this, ArgvParser);

	    this.keyList = ['nodeExecutable', 'scriptFile'];
	    this.formatMap = {
	      nodeExecutable: {},
	      scriptFile: {}
	    };

	    formatListList.forEach(function (formatList) {
	      var key = formatList.shift();
	      if (_this.formatMap[key]) return _Dr2.default.assert(false, '[ArgvParser] duplicate argv_key:' + key);
	      _this.keyList.push(key);
	      _this.formatMap[key] = ArgvParser.parseFormatList(formatList);
	    });
	  }

	  _createClass(ArgvParser, [{
	    key: 'parse',
	    value: function parse(argvList) {
	      var _this2 = this;

	      var argvMap = {};
	      this.keyList.forEach(function (key) {
	        var format = _this2.formatMap[key];
	        if (format.isOptional && argvList.length === 0) {
	          if (format.isDefaultValue) argvMap[key] = format.defaultValue;
	        } else if (format.isMulti && argvList.length > 0) {
	          argvMap[key] = argvList;
	          argvList = [];
	        } else if (argvList.length > 0) {
	          argvMap[key] = argvList.shift();
	        } else {
	          _Dr2.default.log('[Usage] ' + _this2.getUsage());
	          _Dr2.default.log('[Get] ' + _this2.getResultArgvUsage(argvMap));
	          _Dr2.default.log('[Error]\n -- missing arg:<' + key + '> left input argv: [' + argvList.join(', ') + ']');
	          return _Dr2.default.global.process.exit(-1);
	        }
	      });
	      return argvMap;
	    }
	  }, {
	    key: 'getUsage',
	    value: function getUsage() {
	      var _this3 = this;

	      return ' - ' + this.keyList.map(function (v, i) {
	        return '[' + i + '] <' + v + '> ' + _this3.getFormatUsage(v);
	      }).join('\n - ');
	    }
	  }, {
	    key: 'getFormatUsage',
	    value: function getFormatUsage(key) {
	      var format = this.formatMap[key];
	      return (format.isOptional ? ' [OPTIONAL]' : '') + (format.isMulti ? ' [MULTI]' : '') + (format.isDefaultValue ? ' [DEFAULT = ' + format.defaultValue + ']' : '');
	    }
	  }, {
	    key: 'getResultArgvUsage',
	    value: function getResultArgvUsage(argumentMap) {
	      return ' - ' + this.keyList.map(function (v, i) {
	        return '[' + i + '] ' + (argumentMap[v] || '! <' + v + '>');
	      }).join('\n - ');
	    }
	  }], [{
	    key: 'parseFormatList',
	    value: function parseFormatList(formatList) {
	      var format = {};
	      for (var index = 0, indexMax = formatList.length; index < indexMax; index++) {
	        switch (formatList[index]) {
	          case ArgvParser.TYPE.OPTIONAL:
	            format.isOptional = true;
	            break;
	          case ArgvParser.TYPE.MULTI:
	            format.isMulti = true;
	            break;
	          case ArgvParser.TYPE.DEFAULT:
	            index++;
	            _Dr2.default.assert(index >= indexMax, '[ArgvParser][parseFormatList] Missing value for DEFAULT');
	            format.isDefaultValue = true;
	            format.defaultValue = formatList[index]; // pick defaultValue from next index
	            break;
	        }
	      }
	      return format;
	    }
	  }]);

	  return ArgvParser;
	}();

	ArgvParser.TYPE = {
	  OPTIONAL: 'OPTIONAL',
	  MULTI: 'MULTI',
	  DEFAULT: 'DEFAULT'
	};
	exports.default = ArgvParser;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.spawn = exports.run = undefined;

	var _Dr = __webpack_require__(1);

	var _Dr2 = _interopRequireDefault(_Dr);

	var _os = __webpack_require__(14);

	var _os2 = _interopRequireDefault(_os);

	var _child_process = __webpack_require__(15);

	var _child_process2 = _interopRequireDefault(_child_process);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// const SAMPLE_OPTIONS = {
	//   cwd: 'cwd',
	//   env: { env: 'env' },
	//   stdoutStream: process.stdout,
	//   stderrStream: process.stderr,
	//   callbackOutput: (eventType, outputType, data) => {},
	//   callback: (code, signal) => {},
	// }

	var PLATFORM = _os2.default.platform();

	function run(command, options) {
	  if (~PLATFORM.search('win')) return spawn('cmd', ['/s', '/c', command], options);
	  if (~PLATFORM.search('nux') || ~PLATFORM.search('darwin')) return spawn('sh', ['-c', command], options);
	  throw new Error('[Command][run] unrecognized PLATFORM:' + PLATFORM);
	}

	function spawn(command) {
	  var argList = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
	  var _ref = arguments[2];
	  var callback = _ref.callback,
	      cwd = _ref.cwd,
	      env = _ref.env,
	      shell = _ref.shell,
	      detached = _ref.detached,
	      stdoutStream = _ref.stdoutStream,
	      stderrStream = _ref.stderrStream,
	      callbackOutput = _ref.callbackOutput;

	  var childProcess = _child_process2.default.spawn(command, argList, {
	    cwd: cwd || process.cwd(),
	    env: env || process.env,
	    shell: shell || true,
	    detached: detached || false // Added in: v0.7.10
	  });
	  childProcess.stdout.on('data', function (data) {
	    stdoutStream && stdoutStream.write(data);
	    callbackOutput && callbackOutput('data', 'stdout', data);
	  });
	  childProcess.stdout.on('end', function () {
	    // stdoutStream && stdoutStream.end() // may close
	    callbackOutput && callbackOutput('end', 'stdout');
	  });
	  childProcess.stderr.on('data', function (data) {
	    stderrStream && stderrStream.write(data);
	    callbackOutput && callbackOutput('data', 'stderr', data);
	  });
	  childProcess.stderr.on('end', function () {
	    // stderrStream && stderrStream.end()
	    callbackOutput && callbackOutput('end', 'stderr');
	  });
	  childProcess.on('exit', function (code, signal) {
	    _Dr2.default.debug(10, '[Exit] code:', code, 'signal:', signal);
	    callback && callback(code, signal);
	  });
	  childProcess.on('error', function (error) {
	    _Dr2.default.debug(10, '[Error] error:', error, error.stack && error.stack);
	    callback && callback(-1, error);
	  });
	  return childProcess;
	}

	exports.run = run;
	exports.spawn = spawn;
	exports.default = {
	  run: run,
	  spawn: spawn
	};

/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = require("os");

/***/ },
/* 15 */
/***/ function(module, exports) {

	module.exports = require("child_process");

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.modify = exports.copyPath = exports.movePath = exports.deletePath = exports.copyFileSync = exports.writeFileSync = exports.readFileSync = exports.createDirectorySync = exports.getPathTypeSync = exports.MODIFY_OPERATION_TYPE = exports.FILE_TYPE = undefined;

	var _Dr = __webpack_require__(1);

	var _Dr2 = _interopRequireDefault(_Dr);

	var _fs = __webpack_require__(3);

	var _fs2 = _interopRequireDefault(_fs);

	var _path = __webpack_require__(5);

	var _path2 = _interopRequireDefault(_path);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var FILE_TYPE = {
	  File: 'File',
	  Directory: 'Directory',
	  SymbolicLink: 'SymbolicLink', // tricky

	  Other: 'Other',
	  Error: 'Error' // non-exist or other reason
	};

	var MODIFY_OPERATION_TYPE = {
	  MOVE: 'MOVE',
	  COPY: 'COPY',
	  DELETE: 'DELETE'
	};

	function getPathTypeSync(path) {
	  try {
	    var stat = _fs2.default.lstatSync(path);
	    return stat.isDirectory() ? FILE_TYPE.Directory : stat.isFile() ? FILE_TYPE.File : stat.isSymbolicLink() ? FILE_TYPE.SymbolicLink : FILE_TYPE.Other;
	  } catch (error) {
	    return FILE_TYPE.Error;
	  }
	}

	function createDirectorySync(path) {
	  var dirPath = _path2.default.resolve(path);
	  var upperDirPath = _path2.default.dirname(dirPath);
	  getPathTypeSync(upperDirPath) !== FILE_TYPE.Directory && createDirectorySync(upperDirPath);
	  getPathTypeSync(dirPath) !== FILE_TYPE.Directory && _fs2.default.mkdirSync(dirPath);
	}

	function readFileSync(path) {
	  var fd = _fs2.default.openSync(path, 'r');
	  var stat = _fs2.default.fstatSync(fd);
	  var buffer = new Buffer(stat.size);
	  _fs2.default.readSync(fd, buffer, 0, stat.size, 0);
	  _fs2.default.closeSync(fd);
	  return buffer;
	}

	function writeFileSync(path, buffer, mode) {
	  var fd = _fs2.default.openSync(path, 'w', mode);
	  _fs2.default.writeSync(fd, buffer, 0, buffer.length);
	  _fs2.default.closeSync(fd);
	  return buffer;
	}

	function copyFileSync(pathFrom, pathTo) {
	  var fdFrom = _fs2.default.openSync(pathFrom, 'r');
	  var fdTo = _fs2.default.openSync(pathTo, 'w', stat.mode);

	  var BUFFER_LENGTH = 64 * 1024;
	  var buffer = new Buffer(BUFFER_LENGTH);
	  var stat = _fs2.default.fstatSync(fdFrom);
	  var bytesRead = stat.size;
	  var pos = 0;

	  while (bytesRead > 0) {
	    bytesRead = _fs2.default.readSync(fdFrom, buffer, 0, BUFFER_LENGTH, pos);
	    _fs2.default.writeSync(fdTo, buffer, 0, bytesRead);
	    pos += bytesRead;
	  }

	  _fs2.default.closeSync(fdFrom);
	  _fs2.default.closeSync(fdTo);
	}

	// NOT deep delete
	function deletePath(pathType, path) {
	  _Dr2.default.debug(5, '[deletePath]', arguments);
	  switch (pathType) {
	    case FILE_TYPE.File:
	    case FILE_TYPE.SymbolicLink:
	      return _fs2.default.unlinkSync(path);
	    case FILE_TYPE.Directory:
	      return _fs2.default.rmdirSync(path);
	  }
	  _Dr2.default.log('[deletePath] strange path type', pathType);
	}

	// NOT deep move
	function movePath(pathType, pathFrom, pathTo) {
	  _Dr2.default.debug(5, '[movePath]', arguments);
	  switch (pathType) {
	    case FILE_TYPE.File:
	    case FILE_TYPE.SymbolicLink:
	    case FILE_TYPE.Directory:
	      return _fs2.default.renameSync(pathFrom, pathTo);
	  }
	  return _Dr2.default.log('[movePath] strange path type', pathType);
	}

	// NOT deep copy
	function copyPath(pathType, pathFrom, pathTo) {
	  _Dr2.default.debug(5, '[copyPath]', arguments);
	  if (getPathTypeSync(pathTo) === pathType) return _Dr2.default.log('[copyPath] exist, skipped');
	  switch (pathType) {
	    case FILE_TYPE.File:
	    case FILE_TYPE.SymbolicLink:
	      return copyFileSync(pathFrom, pathTo);
	    case FILE_TYPE.Directory:
	      return _fs2.default.mkdirSync(pathTo);
	  }
	  _Dr2.default.log('[copyPath] strange path type', pathType);
	}

	function modify(operationType, pathType, pathFrom, pathTo) {
	  pathType = pathType || getPathTypeSync(pathFrom);
	  switch (operationType) {
	    case MODIFY_OPERATION_TYPE.COPY:
	      createDirectorySync(_path2.default.dirname(pathTo));
	      return copyPath(pathType, pathFrom, pathTo);
	    case MODIFY_OPERATION_TYPE.MOVE:
	      createDirectorySync(_path2.default.dirname(pathTo));
	      return movePath(pathType, pathFrom, pathTo);
	    case MODIFY_OPERATION_TYPE.DELETE:
	      return deletePath(pathType, pathFrom);
	    default:
	      throw new Error('[modify] Error operationType:' + operationType);
	  }
	}

	exports.FILE_TYPE = FILE_TYPE;
	exports.MODIFY_OPERATION_TYPE = MODIFY_OPERATION_TYPE;
	exports.getPathTypeSync = getPathTypeSync;
	exports.createDirectorySync = createDirectorySync;
	exports.readFileSync = readFileSync;
	exports.writeFileSync = writeFileSync;
	exports.copyFileSync = copyFileSync;
	exports.deletePath = deletePath;
	exports.movePath = movePath;
	exports.copyPath = copyPath;
	exports.modify = modify;
	exports.default = {
	  FILE_TYPE: FILE_TYPE,
	  MODIFY_OPERATION_TYPE: MODIFY_OPERATION_TYPE,
	  getPathTypeSync: getPathTypeSync,
	  createDirectorySync: createDirectorySync,
	  readFileSync: readFileSync,
	  writeFileSync: writeFileSync,
	  copyFileSync: copyFileSync,
	  deletePath: deletePath,
	  movePath: movePath,
	  copyPath: copyPath,
	  modify: modify
	};

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.modify = exports.getPrefixMapper = exports.getExtnameFilter = exports.getFileList = exports.Directory = exports.MODIFY_OPERATION_TYPE = exports.WALK_CONTROL_TYPE = exports.FILE_TYPE = exports.FileOperation = undefined;

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _Dr = __webpack_require__(1);

	var _Dr2 = _interopRequireDefault(_Dr);

	var _FileOperation = __webpack_require__(16);

	var _FileOperation2 = _interopRequireDefault(_FileOperation);

	var _fs = __webpack_require__(3);

	var _fs2 = _interopRequireDefault(_fs);

	var _path = __webpack_require__(5);

	var _path2 = _interopRequireDefault(_path);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var WALK_CONTROL_TYPE = {
	  CONTINUE: 'CONTINUE',
	  BREAK: 'BREAK'
	};

	var Directory = function () {
	  function Directory(path) {
	    _classCallCheck(this, Directory);

	    this.path = '';
	    this.content = null;
	    path && this.readContent(path);
	  }

	  _createClass(Directory, [{
	    key: 'readContent',
	    value: function readContent(path) {
	      var _content,
	          _this = this;

	      _Dr2.default.assert(_FileOperation2.default.getPathTypeSync(path) === _FileOperation.FILE_TYPE.Directory, '[DirectoryOperation] Error! path not Directory', path);
	      var content = (_content = {}, _defineProperty(_content, _FileOperation.FILE_TYPE.Directory, new Map()), _defineProperty(_content, _FileOperation.FILE_TYPE.File, []), _defineProperty(_content, _FileOperation.FILE_TYPE.SymbolicLink, []), _defineProperty(_content, _FileOperation.FILE_TYPE.Other, []), _content);
	      _fs2.default.readdirSync(this.path).forEach(function (name) {
	        var subPath = _path2.default.join(_this.path, name);
	        var subPathType = _FileOperation2.default.getPathTypeSync(subPath);
	        switch (subPathType) {
	          case _FileOperation.FILE_TYPE.Directory:
	            content[subPathType].set(name, new _this.constructor(subPath));
	            break;
	          case _FileOperation.FILE_TYPE.File:
	          case _FileOperation.FILE_TYPE.SymbolicLink:
	            content[subPathType].push(name);
	            break;
	          default:
	            content[_FileOperation.FILE_TYPE.Other].push(name);
	            break;
	        }
	      });
	      this.path = path;
	      this.content = content;
	      return content;
	    }
	  }, {
	    key: 'walk',
	    value: function walk(callback, isCallbackFirst) {
	      var _this2 = this;

	      [_FileOperation.FILE_TYPE.File, _FileOperation.FILE_TYPE.SymbolicLink, _FileOperation.FILE_TYPE.Other].forEach(function (type) {
	        var nameList = _this2.content[type];
	        var _iteratorNormalCompletion = true;
	        var _didIteratorError = false;
	        var _iteratorError = undefined;

	        try {
	          for (var _iterator = nameList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	            var name = _step.value;

	            var walkControl = callback(_this2.path, name, type);
	            if (walkControl === WALK_CONTROL_TYPE.CONTINUE) continue; // skip current (should be sub Directory + is_call_before_walk == false)
	            if (walkControl === WALK_CONTROL_TYPE.BREAK) break; // skip current content type
	          }
	        } catch (err) {
	          _didIteratorError = true;
	          _iteratorError = err;
	        } finally {
	          try {
	            if (!_iteratorNormalCompletion && _iterator.return) {
	              _iterator.return();
	            }
	          } finally {
	            if (_didIteratorError) {
	              throw _iteratorError;
	            }
	          }
	        }
	      });
	      var subDirectoryMap = this.content[_FileOperation.FILE_TYPE.Directory];
	      var _iteratorNormalCompletion2 = true;
	      var _didIteratorError2 = false;
	      var _iteratorError2 = undefined;

	      try {
	        for (var _iterator2 = subDirectoryMap[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	          var _step2$value = _slicedToArray(_step2.value, 2),
	              name = _step2$value[0],
	              subDirectory = _step2$value[1];

	          !isCallbackFirst && subDirectory.walk(callback, isCallbackFirst);
	          var walkControl = callback(this.path, name, _FileOperation.FILE_TYPE.Directory);
	          if (walkControl === WALK_CONTROL_TYPE.CONTINUE) continue; // skip current (should be sub Directory + is_call_before_walk == false)
	          if (walkControl === WALK_CONTROL_TYPE.BREAK) break; // skip current content type
	          isCallbackFirst && subDirectory.walk(callback, isCallbackFirst);
	        }
	      } catch (err) {
	        _didIteratorError2 = true;
	        _iteratorError2 = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion2 && _iterator2.return) {
	            _iterator2.return();
	          }
	        } finally {
	          if (_didIteratorError2) {
	            throw _iteratorError2;
	          }
	        }
	      }
	    }
	  }, {
	    key: 'walkOnce',
	    value: function walkOnce(callback) {
	      var _this3 = this;

	      [_FileOperation.FILE_TYPE.File, _FileOperation.FILE_TYPE.SymbolicLink, _FileOperation.FILE_TYPE.Other].forEach(function (type) {
	        var nameList = _this3.content[type];
	        var _iteratorNormalCompletion3 = true;
	        var _didIteratorError3 = false;
	        var _iteratorError3 = undefined;

	        try {
	          for (var _iterator3 = nameList[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	            var name = _step3.value;

	            var walkControl = callback(_this3.path, name, type);
	            if (walkControl === WALK_CONTROL_TYPE.CONTINUE) continue; // skip current (should be sub Directory + is_call_before_walk == false)
	            if (walkControl === WALK_CONTROL_TYPE.BREAK) break; // skip current content type
	          }
	        } catch (err) {
	          _didIteratorError3 = true;
	          _iteratorError3 = err;
	        } finally {
	          try {
	            if (!_iteratorNormalCompletion3 && _iterator3.return) {
	              _iterator3.return();
	            }
	          } finally {
	            if (_didIteratorError3) {
	              throw _iteratorError3;
	            }
	          }
	        }
	      });
	      var subDirectoryMap = this.content[_FileOperation.FILE_TYPE.Directory];
	      var _iteratorNormalCompletion4 = true;
	      var _didIteratorError4 = false;
	      var _iteratorError4 = undefined;

	      try {
	        for (var _iterator4 = subDirectoryMap[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
	          var name = _step4.value;

	          var walkControl = callback(this.path, name, _FileOperation.FILE_TYPE.Directory);
	          if (walkControl === WALK_CONTROL_TYPE.CONTINUE) continue; // skip current (should be sub Directory + is_call_before_walk == false)
	          if (walkControl === WALK_CONTROL_TYPE.BREAK) break; // skip current content type
	        }
	      } catch (err) {
	        _didIteratorError4 = true;
	        _iteratorError4 = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion4 && _iterator4.return) {
	            _iterator4.return();
	          }
	        } finally {
	          if (_didIteratorError4) {
	            throw _iteratorError4;
	          }
	        }
	      }
	    }
	  }, {
	    key: 'copy',
	    value: function copy(pathTo) {
	      _FileOperation2.default.createDirectorySync(pathTo);
	      var pathToMap = _defineProperty({}, this.path, pathTo);
	      this.walk(function (path, name, type) {
	        var pathFrom = _path2.default.join(path, name);
	        var pathTo = _path2.default.join(pathToMap[path], name);
	        pathToMap[pathFrom] = pathTo;
	        _FileOperation2.default.copyPath(type, pathFrom, pathTo);
	      }, true);
	    }
	  }, {
	    key: 'move',
	    value: function move(pathTo) {
	      _FileOperation2.default.createDirectorySync(pathTo);
	      this.walkOnce(function (path, name, type) {
	        return _FileOperation2.default.movePath(type, _path2.default.join(path, name), _path2.default.join(pathTo, name));
	      });
	    }
	  }, {
	    key: 'delete',
	    value: function _delete() {
	      return this.walk(function (path, name, type) {
	        return _FileOperation2.default.deletePath(type, _path2.default.join(path, name));
	      }, false);
	    }
	  }]);

	  return Directory;
	}();

	/*
	 * @{param} path
	 * @{param}[optional] fileFilter(path, name) return true to filter
	 * @{param}[optional] outputMapper(path, name) return new path
	 * if outputMapper, return [ [ sourcePath, mappedPath ] ]
	 * if no outputMapper, return [ sourcePath ]
	 * */


	function getFileList(path, fileFilter, outputMapper) {
	  var fileList = [];

	  function addFile(path, name) {
	    if (fileFilter && fileFilter(path, name)) return;
	    var sourcePath = _path2.default.join(path, name);
	    outputMapper ? fileList.push([sourcePath, outputMapper(path, name)]) : fileList.push(sourcePath);
	  }

	  switch (_FileOperation2.default.getPathTypeSync(path)) {
	    case _FileOperation.FILE_TYPE.File:
	      addFile(_path2.default.dirname(path), _path2.default.basename(path));
	      break;
	    case _FileOperation.FILE_TYPE.Directory:
	      new Directory(path).walk(function (path, name, type) {
	        return type === _FileOperation.FILE_TYPE.File && addFile(path, name);
	      });
	      break;
	  }
	  return fileList;
	}

	function getExtnameFilter(extname) {
	  return function (path, name) {
	    return extname !== _path2.default.extname(name);
	  };
	}
	function getPrefixMapper(prefix) {
	  return function (path, name) {
	    return _path2.default.join(path, prefix + name);
	  };
	}

	// pathTo only needed for copy / move
	function modify(operationType, pathType, pathFrom, pathTo) {
	  pathType = pathType || _FileOperation2.default.getPathTypeSync(pathFrom);
	  switch (pathType) {
	    case _FileOperation.FILE_TYPE.Directory:
	      var directory = new Directory(pathFrom);
	      switch (operationType) {
	        case _FileOperation.MODIFY_OPERATION_TYPE.COPY:
	          return directory.copy(pathTo);
	        case _FileOperation.MODIFY_OPERATION_TYPE.MOVE:
	          directory.move(pathTo);
	          return _FileOperation2.default.deletePath(_FileOperation.FILE_TYPE.Directory, pathFrom);
	        case _FileOperation.MODIFY_OPERATION_TYPE.DELETE:
	          directory.delete(pathTo);
	          return _FileOperation2.default.deletePath(_FileOperation.FILE_TYPE.Directory, pathFrom);
	      }
	      return _Dr2.default.assert(false, '[modify] Error operationType:' + operationType);
	    case _FileOperation.FILE_TYPE.File:
	    case _FileOperation.FILE_TYPE.SymbolicLink:
	      return _FileOperation2.default.modify(operationType, pathType, pathFrom, pathTo);
	  }
	}

	exports.FileOperation = _FileOperation2.default;
	exports.FILE_TYPE = _FileOperation.FILE_TYPE;
	exports.WALK_CONTROL_TYPE = WALK_CONTROL_TYPE;
	exports.MODIFY_OPERATION_TYPE = _FileOperation.MODIFY_OPERATION_TYPE;
	exports.Directory = Directory;
	exports.getFileList = getFileList;
	exports.getExtnameFilter = getExtnameFilter;
	exports.getPrefixMapper = getPrefixMapper;
	exports.modify = modify;
	exports.default = {
	  FileOperation: _FileOperation2.default,
	  FILE_TYPE: _FileOperation.FILE_TYPE,
	  WALK_CONTROL_TYPE: WALK_CONTROL_TYPE,
	  MODIFY_OPERATION_TYPE: _FileOperation.MODIFY_OPERATION_TYPE,
	  Directory: Directory,
	  getFileList: getFileList,
	  getExtnameFilter: getExtnameFilter,
	  getPrefixMapper: getPrefixMapper,
	  modify: modify
	};

/***/ }
/******/ ]);