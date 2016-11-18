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

	module.exports = __webpack_require__(1);


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

/***/ }
/******/ ]);