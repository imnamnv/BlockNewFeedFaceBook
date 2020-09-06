(function () {
    'use strict';

    const removeNode = (node) => node.parentNode.removeChild(node);
    const removeChildren = (node) => {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    };
    const remove = (elements) => {
        document.querySelectorAll(elements.toRemove.join(',')).forEach(removeNode);
        document.querySelectorAll(elements.toEmpty.join(',')).forEach(removeChildren);
    };

    const handleError = e => {
        console.error('-------------------------------------');
        console.error('Something went wrong loading News Feed Eradicator. Please take a screenshot of these details:');
        console.error(e);
        console.error(e.stack);
        console.error('-------------------------------------');
    };

    function loadSettings(callback) {
        if (typeof browser !== 'undefined') {
            browser.storage.sync
                .get(null)
                .then(data => {
                callback(data);
            })
                .catch(e => console.error(e));
        }
        else if (typeof chrome !== 'undefined') {
            chrome.storage.sync.get(null, data => {
                callback(data);
            });
        }
        else {
            throw new Error('Could not find WebExtension API');
        }
    }
    function saveSettings(data) {
        chrome.storage.sync.set(data);
    }

    function symbolObservablePonyfill(root) {
    	var result;
    	var Symbol = root.Symbol;

    	if (typeof Symbol === 'function') {
    		if (Symbol.observable) {
    			result = Symbol.observable;
    		} else {
    			result = Symbol('observable');
    			Symbol.observable = result;
    		}
    	} else {
    		result = '@@observable';
    	}

    	return result;
    }

    /* global window */

    var root;

    if (typeof self !== 'undefined') {
      root = self;
    } else if (typeof window !== 'undefined') {
      root = window;
    } else if (typeof global !== 'undefined') {
      root = global;
    } else if (typeof module !== 'undefined') {
      root = module;
    } else {
      root = Function('return this')();
    }

    var result = symbolObservablePonyfill(root);

    /**
     * These are private action types reserved by Redux.
     * For any unknown actions, you must return the current state.
     * If the current state is undefined, you must return the initial state.
     * Do not reference these action types directly in your code.
     */
    var randomString = function randomString() {
      return Math.random().toString(36).substring(7).split('').join('.');
    };

    var ActionTypes = {
      INIT: "@@redux/INIT" + randomString(),
      REPLACE: "@@redux/REPLACE" + randomString(),
      PROBE_UNKNOWN_ACTION: function PROBE_UNKNOWN_ACTION() {
        return "@@redux/PROBE_UNKNOWN_ACTION" + randomString();
      }
    };

    /**
     * @param {any} obj The object to inspect.
     * @returns {boolean} True if the argument appears to be a plain object.
     */
    function isPlainObject(obj) {
      if (typeof obj !== 'object' || obj === null) return false;
      var proto = obj;

      while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
      }

      return Object.getPrototypeOf(obj) === proto;
    }

    /**
     * Creates a Redux store that holds the state tree.
     * The only way to change the data in the store is to call `dispatch()` on it.
     *
     * There should only be a single store in your app. To specify how different
     * parts of the state tree respond to actions, you may combine several reducers
     * into a single reducer function by using `combineReducers`.
     *
     * @param {Function} reducer A function that returns the next state tree, given
     * the current state tree and the action to handle.
     *
     * @param {any} [preloadedState] The initial state. You may optionally specify it
     * to hydrate the state from the server in universal apps, or to restore a
     * previously serialized user session.
     * If you use `combineReducers` to produce the root reducer function, this must be
     * an object with the same shape as `combineReducers` keys.
     *
     * @param {Function} [enhancer] The store enhancer. You may optionally specify it
     * to enhance the store with third-party capabilities such as middleware,
     * time travel, persistence, etc. The only store enhancer that ships with Redux
     * is `applyMiddleware()`.
     *
     * @returns {Store} A Redux store that lets you read the state, dispatch actions
     * and subscribe to changes.
     */

    function createStore(reducer, preloadedState, enhancer) {
      var _ref2;

      if (typeof preloadedState === 'function' && typeof enhancer === 'function' || typeof enhancer === 'function' && typeof arguments[3] === 'function') {
        throw new Error('It looks like you are passing several store enhancers to ' + 'createStore(). This is not supported. Instead, compose them ' + 'together to a single function.');
      }

      if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
        enhancer = preloadedState;
        preloadedState = undefined;
      }

      if (typeof enhancer !== 'undefined') {
        if (typeof enhancer !== 'function') {
          throw new Error('Expected the enhancer to be a function.');
        }

        return enhancer(createStore)(reducer, preloadedState);
      }

      if (typeof reducer !== 'function') {
        throw new Error('Expected the reducer to be a function.');
      }

      var currentReducer = reducer;
      var currentState = preloadedState;
      var currentListeners = [];
      var nextListeners = currentListeners;
      var isDispatching = false;
      /**
       * This makes a shallow copy of currentListeners so we can use
       * nextListeners as a temporary list while dispatching.
       *
       * This prevents any bugs around consumers calling
       * subscribe/unsubscribe in the middle of a dispatch.
       */

      function ensureCanMutateNextListeners() {
        if (nextListeners === currentListeners) {
          nextListeners = currentListeners.slice();
        }
      }
      /**
       * Reads the state tree managed by the store.
       *
       * @returns {any} The current state tree of your application.
       */


      function getState() {
        if (isDispatching) {
          throw new Error('You may not call store.getState() while the reducer is executing. ' + 'The reducer has already received the state as an argument. ' + 'Pass it down from the top reducer instead of reading it from the store.');
        }

        return currentState;
      }
      /**
       * Adds a change listener. It will be called any time an action is dispatched,
       * and some part of the state tree may potentially have changed. You may then
       * call `getState()` to read the current state tree inside the callback.
       *
       * You may call `dispatch()` from a change listener, with the following
       * caveats:
       *
       * 1. The subscriptions are snapshotted just before every `dispatch()` call.
       * If you subscribe or unsubscribe while the listeners are being invoked, this
       * will not have any effect on the `dispatch()` that is currently in progress.
       * However, the next `dispatch()` call, whether nested or not, will use a more
       * recent snapshot of the subscription list.
       *
       * 2. The listener should not expect to see all state changes, as the state
       * might have been updated multiple times during a nested `dispatch()` before
       * the listener is called. It is, however, guaranteed that all subscribers
       * registered before the `dispatch()` started will be called with the latest
       * state by the time it exits.
       *
       * @param {Function} listener A callback to be invoked on every dispatch.
       * @returns {Function} A function to remove this change listener.
       */


      function subscribe(listener) {
        if (typeof listener !== 'function') {
          throw new Error('Expected the listener to be a function.');
        }

        if (isDispatching) {
          throw new Error('You may not call store.subscribe() while the reducer is executing. ' + 'If you would like to be notified after the store has been updated, subscribe from a ' + 'component and invoke store.getState() in the callback to access the latest state. ' + 'See https://redux.js.org/api-reference/store#subscribelistener for more details.');
        }

        var isSubscribed = true;
        ensureCanMutateNextListeners();
        nextListeners.push(listener);
        return function unsubscribe() {
          if (!isSubscribed) {
            return;
          }

          if (isDispatching) {
            throw new Error('You may not unsubscribe from a store listener while the reducer is executing. ' + 'See https://redux.js.org/api-reference/store#subscribelistener for more details.');
          }

          isSubscribed = false;
          ensureCanMutateNextListeners();
          var index = nextListeners.indexOf(listener);
          nextListeners.splice(index, 1);
          currentListeners = null;
        };
      }
      /**
       * Dispatches an action. It is the only way to trigger a state change.
       *
       * The `reducer` function, used to create the store, will be called with the
       * current state tree and the given `action`. Its return value will
       * be considered the **next** state of the tree, and the change listeners
       * will be notified.
       *
       * The base implementation only supports plain object actions. If you want to
       * dispatch a Promise, an Observable, a thunk, or something else, you need to
       * wrap your store creating function into the corresponding middleware. For
       * example, see the documentation for the `redux-thunk` package. Even the
       * middleware will eventually dispatch plain object actions using this method.
       *
       * @param {Object} action A plain object representing “what changed”. It is
       * a good idea to keep actions serializable so you can record and replay user
       * sessions, or use the time travelling `redux-devtools`. An action must have
       * a `type` property which may not be `undefined`. It is a good idea to use
       * string constants for action types.
       *
       * @returns {Object} For convenience, the same action object you dispatched.
       *
       * Note that, if you use a custom middleware, it may wrap `dispatch()` to
       * return something else (for example, a Promise you can await).
       */


      function dispatch(action) {
        if (!isPlainObject(action)) {
          throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
        }

        if (typeof action.type === 'undefined') {
          throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
        }

        if (isDispatching) {
          throw new Error('Reducers may not dispatch actions.');
        }

        try {
          isDispatching = true;
          currentState = currentReducer(currentState, action);
        } finally {
          isDispatching = false;
        }

        var listeners = currentListeners = nextListeners;

        for (var i = 0; i < listeners.length; i++) {
          var listener = listeners[i];
          listener();
        }

        return action;
      }
      /**
       * Replaces the reducer currently used by the store to calculate the state.
       *
       * You might need this if your app implements code splitting and you want to
       * load some of the reducers dynamically. You might also need this if you
       * implement a hot reloading mechanism for Redux.
       *
       * @param {Function} nextReducer The reducer for the store to use instead.
       * @returns {void}
       */


      function replaceReducer(nextReducer) {
        if (typeof nextReducer !== 'function') {
          throw new Error('Expected the nextReducer to be a function.');
        }

        currentReducer = nextReducer; // This action has a similiar effect to ActionTypes.INIT.
        // Any reducers that existed in both the new and old rootReducer
        // will receive the previous state. This effectively populates
        // the new state tree with any relevant data from the old one.

        dispatch({
          type: ActionTypes.REPLACE
        });
      }
      /**
       * Interoperability point for observable/reactive libraries.
       * @returns {observable} A minimal observable of state changes.
       * For more information, see the observable proposal:
       * https://github.com/tc39/proposal-observable
       */


      function observable() {
        var _ref;

        var outerSubscribe = subscribe;
        return _ref = {
          /**
           * The minimal observable subscription method.
           * @param {Object} observer Any object that can be used as an observer.
           * The observer object should have a `next` method.
           * @returns {subscription} An object with an `unsubscribe` method that can
           * be used to unsubscribe the observable from the store, and prevent further
           * emission of values from the observable.
           */
          subscribe: function subscribe(observer) {
            if (typeof observer !== 'object' || observer === null) {
              throw new TypeError('Expected the observer to be an object.');
            }

            function observeState() {
              if (observer.next) {
                observer.next(getState());
              }
            }

            observeState();
            var unsubscribe = outerSubscribe(observeState);
            return {
              unsubscribe: unsubscribe
            };
          }
        }, _ref[result] = function () {
          return this;
        }, _ref;
      } // When a store is created, an "INIT" action is dispatched so that every
      // reducer returns their initial state. This effectively populates
      // the initial state tree.


      dispatch({
        type: ActionTypes.INIT
      });
      return _ref2 = {
        dispatch: dispatch,
        subscribe: subscribe,
        getState: getState,
        replaceReducer: replaceReducer
      }, _ref2[result] = observable, _ref2;
    }

    function getUndefinedStateErrorMessage(key, action) {
      var actionType = action && action.type;
      var actionDescription = actionType && "action \"" + String(actionType) + "\"" || 'an action';
      return "Given " + actionDescription + ", reducer \"" + key + "\" returned undefined. " + "To ignore an action, you must explicitly return the previous state. " + "If you want this reducer to hold no value, you can return null instead of undefined.";
    }

    function assertReducerShape(reducers) {
      Object.keys(reducers).forEach(function (key) {
        var reducer = reducers[key];
        var initialState = reducer(undefined, {
          type: ActionTypes.INIT
        });

        if (typeof initialState === 'undefined') {
          throw new Error("Reducer \"" + key + "\" returned undefined during initialization. " + "If the state passed to the reducer is undefined, you must " + "explicitly return the initial state. The initial state may " + "not be undefined. If you don't want to set a value for this reducer, " + "you can use null instead of undefined.");
        }

        if (typeof reducer(undefined, {
          type: ActionTypes.PROBE_UNKNOWN_ACTION()
        }) === 'undefined') {
          throw new Error("Reducer \"" + key + "\" returned undefined when probed with a random type. " + ("Don't try to handle " + ActionTypes.INIT + " or other actions in \"redux/*\" ") + "namespace. They are considered private. Instead, you must return the " + "current state for any unknown actions, unless it is undefined, " + "in which case you must return the initial state, regardless of the " + "action type. The initial state may not be undefined, but can be null.");
        }
      });
    }
    /**
     * Turns an object whose values are different reducer functions, into a single
     * reducer function. It will call every child reducer, and gather their results
     * into a single state object, whose keys correspond to the keys of the passed
     * reducer functions.
     *
     * @param {Object} reducers An object whose values correspond to different
     * reducer functions that need to be combined into one. One handy way to obtain
     * it is to use ES6 `import * as reducers` syntax. The reducers may never return
     * undefined for any action. Instead, they should return their initial state
     * if the state passed to them was undefined, and the current state for any
     * unrecognized action.
     *
     * @returns {Function} A reducer function that invokes every reducer inside the
     * passed object, and builds a state object with the same shape.
     */


    function combineReducers(reducers) {
      var reducerKeys = Object.keys(reducers);
      var finalReducers = {};

      for (var i = 0; i < reducerKeys.length; i++) {
        var key = reducerKeys[i];

        if (typeof reducers[key] === 'function') {
          finalReducers[key] = reducers[key];
        }
      }

      var finalReducerKeys = Object.keys(finalReducers); // This is used to make sure we don't warn about the same

      var shapeAssertionError;

      try {
        assertReducerShape(finalReducers);
      } catch (e) {
        shapeAssertionError = e;
      }

      return function combination(state, action) {
        if (state === void 0) {
          state = {};
        }

        if (shapeAssertionError) {
          throw shapeAssertionError;
        }

        var hasChanged = false;
        var nextState = {};

        for (var _i = 0; _i < finalReducerKeys.length; _i++) {
          var _key = finalReducerKeys[_i];
          var reducer = finalReducers[_key];
          var previousStateForKey = state[_key];
          var nextStateForKey = reducer(previousStateForKey, action);

          if (typeof nextStateForKey === 'undefined') {
            var errorMessage = getUndefinedStateErrorMessage(_key, action);
            throw new Error(errorMessage);
          }

          nextState[_key] = nextStateForKey;
          hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
        }

        hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
        return hasChanged ? nextState : state;
      };
    }

    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);

      if (Object.getOwnPropertySymbols) {
        keys.push.apply(keys, Object.getOwnPropertySymbols(object));
      }

      if (enumerableOnly) keys = keys.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      return keys;
    }

    function _objectSpread2(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i] != null ? arguments[i] : {};

        if (i % 2) {
          ownKeys(source, true).forEach(function (key) {
            _defineProperty(target, key, source[key]);
          });
        } else if (Object.getOwnPropertyDescriptors) {
          Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        } else {
          ownKeys(source).forEach(function (key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
          });
        }
      }

      return target;
    }

    /**
     * Composes single-argument functions from right to left. The rightmost
     * function can take multiple arguments as it provides the signature for
     * the resulting composite function.
     *
     * @param {...Function} funcs The functions to compose.
     * @returns {Function} A function obtained by composing the argument functions
     * from right to left. For example, compose(f, g, h) is identical to doing
     * (...args) => f(g(h(...args))).
     */
    function compose() {
      for (var _len = arguments.length, funcs = new Array(_len), _key = 0; _key < _len; _key++) {
        funcs[_key] = arguments[_key];
      }

      if (funcs.length === 0) {
        return function (arg) {
          return arg;
        };
      }

      if (funcs.length === 1) {
        return funcs[0];
      }

      return funcs.reduce(function (a, b) {
        return function () {
          return a(b.apply(void 0, arguments));
        };
      });
    }

    /**
     * Creates a store enhancer that applies middleware to the dispatch method
     * of the Redux store. This is handy for a variety of tasks, such as expressing
     * asynchronous actions in a concise manner, or logging every action payload.
     *
     * See `redux-thunk` package as an example of the Redux middleware.
     *
     * Because middleware is potentially asynchronous, this should be the first
     * store enhancer in the composition chain.
     *
     * Note that each middleware will be given the `dispatch` and `getState` functions
     * as named arguments.
     *
     * @param {...Function} middlewares The middleware chain to be applied.
     * @returns {Function} A store enhancer applying the middleware.
     */

    function applyMiddleware() {
      for (var _len = arguments.length, middlewares = new Array(_len), _key = 0; _key < _len; _key++) {
        middlewares[_key] = arguments[_key];
      }

      return function (createStore) {
        return function () {
          var store = createStore.apply(void 0, arguments);

          var _dispatch = function dispatch() {
            throw new Error('Dispatching while constructing your middleware is not allowed. ' + 'Other middleware would not be applied to this dispatch.');
          };

          var middlewareAPI = {
            getState: store.getState,
            dispatch: function dispatch() {
              return _dispatch.apply(void 0, arguments);
            }
          };
          var chain = middlewares.map(function (middleware) {
            return middleware(middlewareAPI);
          });
          _dispatch = compose.apply(void 0, chain)(store.dispatch);
          return _objectSpread2({}, store, {
            dispatch: _dispatch
          });
        };
      };
    }

    function createThunkMiddleware(extraArgument) {
      return function (_ref) {
        var dispatch = _ref.dispatch,
            getState = _ref.getState;
        return function (next) {
          return function (action) {
            if (typeof action === 'function') {
              return action(dispatch, getState, extraArgument);
            }

            return next(action);
          };
        };
      };
    }

    var thunk = createThunkMiddleware();
    thunk.withExtraArgument = createThunkMiddleware;

    var config = {
        newFeatureIncrement: 1,
    };

    //Kanji
    const BuiltinQuotes = [
		{
			id: 1,
			text: `会 : Hội.
			Âm on : かい.
			Âm kun : あ-う.
			あ-わせる.
			会う（あう）: gặp.
			会社（かいしゃ）: công ty.
			社会（しゃかい）: xã hội.`
			,
			source: 'Nam NV',
		},
		{
			id: 2,
			text: ` 同 : Đồng.
			Âm on : どう.
			Âm kun : おな-じ.
			同じ（おなじ）: giống nhau.
			同意（どうい）: đồng ý.
			同感（どうかん）: đồng cảm.`,
			source: 'Nam NV',
		}, {
			id: 3,
			text: `事 : Sự.
			Âm on : じ,ず.
			Âm kun : こと,
			つか-う.
			事故（じこ）: tai nạn.
			家事（かじ）: việc nhà.
			火事（かじ）: hỏa hoạn.`,
			source: 'Nam NV',
		}, {
			id: 4,
			text: `自 : Tự.
			Âm on : し, じ.
			Âm kun : みずか-ら,
			おの-ずから.
			自分（じぶん）: bản thân.
			自動（じどう）: tự động.
			自転車（じてんしゃ）: xe đạp.
			自由（じゆう）: tự do.
			`,
			source: 'Nam NV',
		}, {
			id: 5,
			text: ` 社 : Xã.
			Âm on : しゃ,
			じゃ.
			Âm kun :社会（しゃかい）: xã hội.
			社長（しゃちょう）: giám đốc.
			神社（じんじゃ）: đền.
			`,
			source: 'Nam NV',
		}, {
			id: 6,
			text: `発 : Phát.
			Âm on : はつ.
			Âm kun .
			発表（はっぴょう）: phát biểu.
			出発（しゅっぱつ）: xuất phát.
			`,
			source: 'Nam NV',
		}, {
			id: 7,
			text: `者 : Giả.
			Âm on : しゃ.
			Âm kun : もの.
			医者（いしゃ）: bác sỹ.
			科学者（かがくしゃ）: nhà khoa học.
			若者（わかもの）: giới trẻ.
			
			`,
			source: 'Nam NV',
		}, {
			id: 8,
			text: ` 地 : Địa.
			Âm on : ち / じ.
			Âm kun :
			地図（ちず）: bản đồ.
			地下鉄（ちかてつ）: tàu điện ngầm.
			地震（じしん）: động đất.
			`,
			source: 'Nam NV',
		}, {
			id: 9,
			text: `業 : Nghiệp.
			Âm on : ぎょう.
			Âm kun .
			工業(こうぎょう)：công nghiệp.
			農業(のうぎょう)：nông nghiệp.
			開業(かいぎょう)]：khởi nghiệp.
			`,
			source: 'Nam NV',
		}, {
			id: 10,
			text: `方 : Phương.
			Âm on : ほう.
			Âm kun : かた.
			方（かた）: ngài, vị. ví dụ : その方はだれですか Vị đó là ai
			thế?.
			考え方（かんがえかた）: cách nghĩ. Ví dụ : あなたの考え方
			がすきです。tôi thích cách nghĩ của bạn.
			方法（ほうほう）: phương pháp.
			`,
			source: 'Nam NV',
		}, {
			id: 11,
			text: `新 : Tân.
			Âm on : しん.
			Âm kun : あたら-しい.
			新しい(あたらしい)：mới.
			新聞(しんぶん)：báo.
			新婚(しんこん)：tân hôn.
			`,
			source: 'Nam NV',
		},
		{
			id: 12,
			text: `場 : Trường.
			Âm on : じょう.
			ちょう.
			Âm kun : ば.
			場所(ばしょ)：địa điểm.
			市場(しじょう)：thị trường. Cách đọc khác : いちば : chợ.
			会場(かいじょう)：hội trường.

			`,
			source: 'Nam NV',
		}, {
			id: 13,
			text: `員 : Viên.
			Âm on : いん.
			Âm kun .
			店員(てんいん)：nhân viên cửa hàng.
			会社員(かいしゃいん)：nhân viên công ty.
			
			`,
			source: 'Nam NV',
		}, {
			id: 14,
			text: ` 立 : Lập.
			Âm on : りつ.
			Âm kun : た-つ,
			た-てる.
			公立(こうりつ)：công lập.
			立つ(たつ)：đứng.
			国立(こくりつ)：quốc lập, quốc khánh.
			`,
			source: 'Nam NV',
		}, {
			id: 15,
			text: ` 開 : Khai.
			Âm on : かい.
			Âm kun : ひら-く,
			ひら-き,
			ひら-ける,
			あ-く.
			開く(ひらく)：mở ra, khai lập.
			開発(かいはつ)：sáng lập (doanh nghiệp).
			開業(かいぎょう)：khởi nghiệp.
			`,
			source: 'Nam NV',
		}, {
			id: 16,
			text: `手 : Thủ.
			Âm on : しゅ,
			ず.
			Âm kun : て.
			手(て)：tay.
			手術- phẫu thuật.
			手足- tay chân.

			`,
			source: 'Nam NV',
		}, {
			id: 17,
			text: `力 : Lực.
			Âm on : りょく.
			Âm kun : ちから.
			努力(どりょく)- nỗ lực.
			協力(きょうりょく)- hợp lực.
			力(ちから)- lực.
			`,
			source: 'Nam NV',
		}, {
			id: 18,
			text: ` 問 : Vấn.
			Âm on : もん.
			Âm kun : と-う,
			と-い.
			問題(もんだい)- vấn đề.
			問う(とう)- hỏi.
			質問(しつもん)- câu hỏi.
			`,
			source: 'Nam NV',
		}, {
			id: 19,
			text: `代 : Đại.
			Âm on : だい.
			Âm kun .
			代表(だいひょう)- đại biểu.
			時代(じだい)- thời đại.
			`,
			source: 'Nam NV',
		}, {
			id: 20,
			text: ` 明 : Minh.
			Âm on : めい.
			Âm kun : あ-かり/あか-るい,
			あか-るむ/あか-らむ,
			あき-らか/あ-ける,
			あ-くる.
			明かり(あかり)- ánh sáng.
			明るい(あかるい)- sáng sủa.
			梅雨明け- kết thức mùa mưa.
			明らか- rõ ràng		.	
			`,
			source: 'Nam NV',
		}, {
			id: 21,
			text: `動 : Động .
			Âm on : どう.
			Âm kun : うご-く.
			Những từ hay gặp .
			動く(うごく)- cử động、chuyển động.
			自動(じどう)- tự động.
			感動(かんどう)- cảm động.
			`,
			source: 'Nam NV',
		},
		{
			id: 22,
			text: `京 : Kinh .
			Âm on : きょう.
			けい.
			Âm kun .
			Những từ hay gặp .
			東京(とうきょう)- Thủ đô Tokyo.
			京都(きょうと)- thành phố Kyoto.
			`,
			source: 'Nam NV',
		},
		{
			id: 23,
			text: `目 : Mục .
			Âm on : もく.
			ぼく.
			Âm kun : め.
			Những từ hay gặp .
			目(め)- mắt.
			目的(もくてき)- mục đích.
			`,
			source: 'Nam NV',
		},
		{
			id: 24,
			text: `通 : Thông .
			Âm on : つう.
			Âm kun : とお-る/とお-り.
			とお-す.
			Những từ hay gặp .
			交通(こうつう)- giao thông.
			通路(つうろ)- đường xe chạy.
			通り(とおり)- con đường.
			`,
			source: 'Nam NV',
		},
		{
			id: 25,
			text: `言 : Ngôn .
			Âm on : げん.
			Âm kun : い-う.
			Những từ hay gặp .
			言う(いう)- nói.
			言語(げんご)- ngôn ngữ.
			`,
			source: 'Nam NV',
		},
		{
			id: 26,
			text: `理 : Lý .
			Âm on : り.
			Âm kun .
			Những từ hay gặp .
			理由(りゆう)- lý do.
			地理(ちり)- địa lý.
			物理(ぶつり)- vật lý.
			`,
			source: 'Nam NV',
		},
		{
			id: 27,
			text: `体 : Thể .
			Âm on : たい.
			てい.
			Âm kun : からだ.
			Những từ hay gặp .
			体(からだ)：cơ thể.
			体温(たいおん)：thân nhiệt.
			体育（たいいく）︓thể dục.
			`,
			source: 'Nam NV',
		},
		{
			id: 28,
			text: `田 : Điền .
			Âm on : でん.
			Âm kun : た.
			Những từ hay gặp .
			田（た）︓ruộng.
			田畑- ruộng.
			新田- ruộng mới.
			`,
			source: 'Nam NV',
		},
		{
			id: 29,
			text: `主 : Chủ .
			Âm on : しゅ.
			ず.
			Âm kun : ぬし.
			おも-な.
			Những từ hay gặp .
			主(ぬし)- ông chủ.
			主に(おもに)- chủ yếu là.
			主体(しゅたい)- chủ thể.
			主婦(しゅふ)-vợ.
			`,
			source: 'Nam NV',
		},
		{
			id: 30,
			text: `題 : Đề .
			Âm on : だい.
			Âm kun .
			Những từ hay gặp .
			問題(もんだい)- vấn đề.
			話題(わだい)- chủ đề cuộc nói chuyện.
			宿題(しゅくだい)- bài tập về nhà.
			`,
			source: 'Nam NV',
		},
		{
			id: 31,
			text: `意 : Ý .
				Âm on : い.
				Âm kun .
				Những từ hay gặp .
				意見(いけん)- ý kiến.
				意味(いみ)- ý nghĩa.
				意外(いがい)- ngoài dự kiến.
				`,
			source: 'Nam NV',
		},
		{
			id: 32,
			text: `不 : Bất .
				Âm on : フ.
				Âm kun .
				Những từ hay gặp .
				不満(ふまん)- chưa thỏa mãn.
				不便(ふべん)- bất tiện.
				`,
			source: 'Nam NV',
		},
		{
			id: 33,
			text: `作 : Tác .
				Âm on : さく.
				さ.
				Âm kun : つく-る.
				つく-り.
				Những từ hay gặp .
				作る(つくる)- làm, chế tác.
				作業(さぎょう)- công việc.
				作家(さっか)- tác giả.
				`,
			source: 'Nam NV',
		},
		{
			id: 34,
			text: `用 : Dụng .
				Âm on : よう.
				Âm kun : もち-いる.
				Những từ hay gặp .
				作用(さよう)- tác dụng.
				使用(しよう)- sử dụng.
				用いる(もちいる)- có được.
				`,
			source: 'Nam NV',
		},
		{
			id: 35,
			text: `度 : Độ .
				Âm on : どう.
				Âm kun : たび.
				Những từ hay gặp .
				程度(ていど)- mức độ.
				態度(たいど)- thái độ.
				度(たび)- dịp.
				`,
			source: 'Nam NV',
		},
		{
			id: 36,
			text: `強 : Cường .
				Âm on : きょう.
				ごう.
				Âm kun : つよ-い.
				つよ-まる/つよ-める.
				し-いる.
				Những từ hay gặp .
				強引（ごういん）︓cưỡng bức, ép buộc.
				強い（つよい）︓mạnh mẽ.
				強調（きょうちょう）︓nhấn mạnh.
				`,
			source: 'Nam NV',
		},
		{
			id: 37,
			text: `公 : Công .
				Âm on : こう.
				Âm kun : おおやけ.
				Những từ hay gặp .
				公園（こうえん）︓công viên.
				公共（こうきょう）︓công cộng.
				公立（こうりつ）︓công lập.
				`,
			source: 'Nam NV',
		},
		{
			id: 38,
			text: `持 : Trì .
				Âm on : じ.
				Âm kun : も-つ.
				も-ち.
				Những từ hay gặp .
				維持（いじ）︓duy trì.
				持つ（もつ）︓nắm, cầm.
				`,
			source: 'Nam NV',
		},
		{
			id: 39,
			text: `野 : Dã .
				Âm on : や.
				しょ.
				Âm kun : の.
				Những từ hay gặp .
				野球（やきゅう）︓bóng chày.
				野原（のはら）︓đồng cỏ.
				野菜（やさい）︓rau củ.
				`,
			source: 'Nam NV',
		},
		{
			id: 40,
			text: `以 : Dĩ .
				Âm on : い.
				Âm kun .
				Những từ hay gặp .
				以上（いじょう）︓trở lên.
				以下（いか）︓trở xuống.
				以前（いぜん）︓trước ~.
				`,
			source: 'Nam NV',
		},
		{
			id: 41,
			text: `思 : Tư .
				Âm on : し.
				Âm kun : おも-う.
				おもえら-く.
				おぼ-す.
				Những từ hay gặp .
				思う（おもう）︓suy nghĩ.
				思考（しこう）︓suy nghĩcẩn thận.
				`,
			source: 'Nam NV',
		},
		{
			id: 42,
			text: `家 : Gia .
				Âm on : か.
				け.
				Âm kun : いえ.
				うち.
				Những từ hay gặp .
				家（いえ）︓nhà.
				作家（さっか）︓tác giả.
				家族（かぞく）︓gia đình.
				`,
			source: 'Nam NV',
		},
		{
			id: 43,
			text: `世 : Thế .
				Âm on : せい.
				せ.
				Âm kun : よ.
				Những từ hay gặp .
				世界（せかい）︓thế giới.
				世紀（せいき）︓thế kỷ.
				世の中（よのなか）︓xã hội.
				`,
			source: 'Nam NV',
		},

		{
			id: 44,
			text: `多 : Đa .
				Âm on : た.
				Âm kun : おお-い.
				Những từ hay gặp .
				多忙（たぼう）︓bận rộn.
				多い（おおい）︓nhiều.
				`,
			source: 'Nam NV',
		},
		{
			id: 45,
			text: `正 : Chính .
				Âm on : せい.
				しょう.
				Âm kun : ただ-しい.
				ただ-す.
				まさ.
				Những từ hay gặp .
				正しい（ただしい）︓chính xác.
				正月（しょうがつ）︓Tết.
				正門（せいもん）︓cửa chính.
				`,
			source: 'Nam NV',
		},
		{
			id: 46,
			text: `安 : An .
				Âm on : あん.
				Âm kun : やす-い.
				やす-まる.
				やす.
				Những từ hay gặp .
				安い（やすい）︓rẻ.
				安全（あんぜん）︓an toàn.
				不安（ふあん）︓bất an.
				`,
			source: 'Nam NV',
		},
		{
			id: 47,
			text: `院 : Viện .
				Âm on : いん.
				Âm kun .
				Những từ hay gặp .
				病院（びょういん）︓bệnh viện.
				大学院（だいがくいん）︓cao học.
				`,
			source: 'Nam NV',
		},
		{
			id: 48,
			text: `心 : Tâm .
				Âm on : しん.
				Âm kun : こころ.みる ため.す.
				Những từ hay gặp .
				心（こころ）︓tâm, tấm lòng.
				関心（かんしん）︓quan tâm.
				心臓（しんぞう）︓trái tim (sinh học).
				`,
			source: 'Nam NV',
		},
		{
			id: 49,
			text: `界 : Giới .
				Âm on : かい.
				Âm kun .
				Những từ hay gặp .
				世界（せかい）︓thế giới.
				`,
			source: 'Nam NV',
		},
		{
			id: 50,
			text: `教 : Giáo .
				Âm on : きょう.
				Âm kun : おし-える.
				おそ-わる.
				Những từ hay gặp .
				教える（おしえる）︓dạy dỗ.
				教わる（おそわる）︓được dạy.
				教師（きょうし）︓giáo viên.
				`,
			source: 'Nam NV',
		},
		{
			id: 51,
			text: `文 : Văn .
					Âm on : ぶん.
					Âm kun : ふみ.
					Những từ hay gặp .
					文法（ぶんぽう）︓ngữ pháp.
					論文（ろんぶん）︓luận văn.
					文章（ぶんしょう）︓đoạn văn.
					`,
			source: 'Nam NV',
		},
		{
			id: 52,
			text: `元 : Nguyên .
					Âm on : げん.
					がん.
					Âm kun : もと.
					Những từ hay gặp .
					元々（もともと）︓vốn dĩ.
					元日（がんじつ）︓Ngày mùng 1 Tết元気（げんき）︓.
					khỏe khoắn.
					`,
			source: 'Nam NV',
		},
		{
			id: 53,
			text: `重 : Trọng .
					Âm on : じゅう.
					ちょう.
					Âm kun : おも-い/おも-り.
					おも-なう/かさ-ねる.
					かさ-なる.
					Những từ hay gặp .
					重い（おもい）︓nặng.
					重要（じゅうよう）︓trọng yếu.
					重点（じゅうてん）︓trọng điểm.
					`,
			source: 'Nam NV',
		},
		{
			id: 54,
			text: `近 : Cận .
					Âm on : きん.
					Âm kun : ちか-い.
					ちか-く.
					Những từ hay gặp .
					近く（ちかく）︓gần đây.
					近所（きんじょ）︓hàng xóm.
					最近（さいきん）︓dạo gần đây.
					`,
			source: 'Nam NV',
		},
		{
			id: 55,
			text: `考 : Khảo .
					Âm on : こう.
					Âm kun : かんが-える.
					Những từ hay gặp .
					考える（かんがえる）︓suy nghĩ.
					思考（しこう）︓suy nghĩ cẩn thận.
					参考書（さんこうしょ）︓sách tham khảo.
					`,
			source: 'Nam NV',
		},
		{
			id: 56,
			text: `画 : Họa, hoạch .
					Âm on : が.
					Âm kun : えが-く.
					かく-する.
					かぎ-る.
					Những từ hay gặp .
					画面（がめん）︓màn hình.
					映画（えいが）︓phim.
					画家（がか）︓hoạ sỹ.
					`,
			source: 'Nam NV',
		},
		{
			id: 57,
			text: `海 : Hải .
					Âm on : かい.
					Âm kun : うみ.
					Những từ hay gặp .
					海（うみ）︓biển.
					海外（かいがい）︓hải ngoại.
					`,
			source: 'Nam NV',
		},
		{
			id: 58,
			text: `売 : Mại .
					Âm on : ばい.
					Âm kun : う-る.
					Những từ hay gặp .
					売る（うる）︓bán.
					売買（ばいばい）︓mua bán.
					売り場（うりば）︓quầy bán.
					`,
			source: 'Nam NV',
		},
		{
			id: 59,
			text: `知 : Tri .
					Âm on : ち.
					Âm kun : し-る.
					Những từ hay gặp .
					知る（しる）︓biết.
					知識（ちしき）︓tri thức.
					`,
			source: 'Nam NV',
		},
		{
			id: 60,
			text: `道 : Đạo .
					Âm on : どう.
					Âm kun : みち.
					Những từ hay gặp .
					道（みち）︓con đường.
					茶道（ちゃどう）︓trà đạo.
					柔道（じゅどう）︓nhu đạo.
					`,
			source: 'Nam NV',
		},
		{
			id: 61,
			text: `集: Tập .
						Âm on : しゅう.
						Âm kun : あつ-まる.
						あつ-める.
						Những từ hay gặp .
						集まる（あつまる）︓tụ tập.
						集中（しゅうちゅう）︓tập trung.
						`,
			source: 'Nam NV',
		},
		{
			id: 62,
			text: `別: Biệt .
						Âm on : べつ.
						Âm kun : わか-れる.
						Những từ hay gặp .
						区別（くべつ）︓chia theo khu.
						別れる（わかれる）︓chia tay, phân cách.
						特別（とくべつ）︓đặc biệt.
						`,
			source: 'Nam NV',
		},
		{
			id: 63,
			text: `物: Vật .
						Âm on : ぶつ.
						もつ.
						Âm kun : もの.
						Những từ hay gặp .
						動物（どうぶつ）︓động vật.
						物事（ものごと）︓mọi việc.
						荷物（にもつ）︓hành lý.
						`,
			source: 'Nam NV',
		},
		{
			id: 64,
			text: `使: Sử, sứ .
						Âm on : し.
						Âm kun : つか-う.
						つか-い.
						Những từ hay gặp .
						使う（つかう）︓sử dụng.
						使用（しよう）︓sử dụng.
						`,
			source: 'Nam NV',
		},
		{
			id: 65,
			text: `品: Phẩm .
						Âm on : ひん.
						Âm kun : しな.
						品物（しなもの）︓hàng hóa.
						食料品（しょくりょうひん）︓thực phẩm.
						作品（さくひん）︓tác phẩm.
						`,
			source: 'Nam NV',
		},
		{
			id: 66,
			text: `計: Kế, kê .
						Âm on : けい.
						きょう.
						Âm kun : はか-る.
						Những từ hay gặp .
						時計（とけい）︓đồng hồ.
						計る（はかる）︓đo đạc.
						計算（けいさん）︓kế toán.
						`,
			source: 'Nam NV',
		},
		{
			id: 67,
			text: `死: Tử .
						Âm on : し.
						Âm kun : し-ぬ.
						Những từ hay gặp .
						死ぬ（しぬ）︓chết.
						死体（したい）︓tử thi.
						`,
			source: 'Nam NV',
		},
		{
			id: 68,
			text: `特: Đặc .
						Âm on : とく.
						Âm kun .
						Những từ hay gặp .
						特徴（とくちょう）︓đặc trưng.
						特に（とくに）︓đặc biệt là.
						特別（とくべつ）︓đặc biệt.
						`,
			source: 'Nam NV',
		},
		{
			id: 69,
			text: `私: Tư .
						Âm on : し.
						Âm kun : わたくし.
						わたし.
						Những từ hay gặp .
						私鉄（してつ）︓hãng đường sắt tư nhân.
						私（わたし）︓tôi私立（しりつ）︓tư lập.
						`,
			source: 'Nam NV',
		},
		{
			id: 70,
			text: `始: Thủy .
						Âm on : し.
						Âm kun : はじ-める.
						はじ-まる.
						Những từ hay gặp .
						始める（はじめる）︓bắt đầu.
						始めに（はじめに）︓đầu tiên thì.
						始末（しまつ）︓đầu cuối.
						`,
			source: 'Nam NV',
		},
		{
			id: 71,
			text: `朝 : Triều .
							Âm on : ちょう.
							Âm kun : あさ.
							Những từ hay gặp .
							朝（あさ）︓buổi sáng.
							朝食（ちょうしょく）︓cơm sáng.
							`,
			source: 'Nam NV',
		},
		{
			id: 72,
			text: `運 : Vận .
							Âm on : うん.
							Âm kun : はこ-ぶ.
							Những từ hay gặp .
							運転（うんてん）︓vận chuyển.
							運が付いている（うんがついている）︓may mắn.
							運ぶ（はこぶ）︓vận chuyển.
							`,
			source: 'Nam NV',
		},
		{
			id: 73,
			text: `終 : Chung .
							Âm on : しゅう.
							Âm kun : お-わる.
							お-える.
							つい.
							Những từ hay gặp .
							終わる（おわる）︓kết thức.
							終了（しゅうりょう）︓hoàn thành.
							`,
			source: 'Nam NV',
		},
		{
			id: 74,
			text: `台 : Đài .
							Âm on : だい.
							たい.
							Âm kun : うてな.
							Những từ hay gặp .
							台所（だいどころ）︓nhà bếp.
							台形（だいけい）︓hình thang.
							台湾（たいわん）︓đài loan.
							`,
			source: 'Nam NV',
		},
		{
			id: 75,
			text: `広 : Quảng .
							Âm on : こう.
							Âm kun : ひろ-い.
							ひろ-まる/ひろ-める.
							ひろ-がる/ひろ-げる.
							Những từ hay gặp .
							広い（ひろい）︓rộng rãi.
							広場（ひろば）︓quảng trường.
							広大（こうだい）︓quảng đại.
							`,
			source: 'Nam NV',
		},
		{
			id: 76,
			text: `住 : Trú, trụ .
							Âm on : じゅう.
							ちょう.
							Âm kun : す-む.
							す-まう.
							Những từ hay gặp .
							住む（すむ）︓sinh sống.
							住所（じゅしょ）︓địa chỉ.
							`,
			source: 'Nam NV',
		},
		{
			id: 77,
			text: `真 : Chân .
							Âm on : しん.
							Âm kun : ま〜.
							Những từ hay gặp .
							写真（しゃしん）︓ảnh.
							真っ黒（まっくろ）︓đen tuyền.
							真っ赤（まっか）︓đỏ quạch.
							`,
			source: 'Nam NV',
		},
		{
			id: 78,
			text: `有 : Hữu .
							Âm on : ゆう.
							Âm kun : あ（有る）.
							Những từ hay gặp .
							有名（ゆうめい）︓nổi tiếng.
							有する（ゆうする）︓có, tồn tại.
							有利（ゆうり）︓có lợi.
							`,
			source: 'Nam NV',
		},
		{
			id: 79,
			text: `口 : Khẩu .
							Âm on : こう.
							Âm kun : くち.
							Những từ hay gặp .
							口（くち）︓miệng.
							窓口（まどぐち）︓quầy bán vé.
							入り口（いりぐち）︓cửa vào.
							`,
			source: 'Nam NV',
		},
		{
			id: 80,
			text: `少 : Thiểu .
							Âm on : しょう.
							Âm kun : すく-ない.
							すこ-し.
							Những từ hay gặp .
							減少（げんしょう）︓giảm thiểu.
							少ない（すくない）︓ít.
							少々（しょうしょう）︓một chút.
							`,
			source: 'Nam NV',
		},


		{
			id: 81,
			text: `町 : Đinh.
							Âm on : ちょう.
							Âm kun : まち.
							Những từ hay gặp .
							町（まち）︓thành phố.
							`,
			source: 'Nam NV',
		},
		{
			id: 82,
			text: `料 : Liệu .
							Âm on : りょう.
							Âm kun .
							Những từ hay gặp .
							原料（げんりょう）︓nguyên liệu.
							材料（ざいりょう）︓vật liệu.
							料理（りょうり）︓món ăn.
							`,
			source: 'Nam NV',
		},
		{
			id: 83,
			text: `工 : Công .
							Âm on : こう.
							Âm kun .
							Những từ hay gặp .
							工業（こうぎょう）︓công nghiệp.
							工場（こうじょう）︓công trường, nhà máy.
							`,
			source: 'Nam NV',
		},
		{
			id: 84,
			text: `建 : Kiến .
							Âm on : けん.
							Âm kun : た-てる.
							た-て.
							Những từ hay gặp .
							建てる（たてる）︓xây dựng.
							建物（たてもの）︓nhà cao tầng.
							建築（けんちく）︓kiến trúc.
							`,
			source: 'Nam NV',
		},
		{
			id: 85,
			text: `空 : Không .
							Âm on : くう.
							Âm kun : そら.
							あ-く.
							あ-き.
							あ-ける.
							から.
							す-く.
							す-かす.
							Những từ hay gặp .
							空（そら）︓bầu trời.
							空手道（からてどう）︓Karatedo.
							空港（くうこう）︓sân bay.
							`,
			source: 'Nam NV',
		},
		{
			id: 86,
			text: `急 : Cấp .
							Âm on : きゅう.
							Âm kun : いそ-ぐ.
							いそ-ぎ.
							Những từ hay gặp .
							救急車（きゅうきゅうしゃ）︓xe cấp cứu.
							急ぐ（いそぐ）︓vội.
							特急電車（とっきゅうでんしゃ）︓tàu tốc hành.
							`,
			source: 'Nam NV',
		},
		{
			id: 87,
			text: `止 : Chỉ .
							Âm on : し.
							Âm kun : と-まる,
							と-める,
							とど-め,
							とど-まる,
							や-める,
							や-む,
							よ-す.
							Những từ hay gặp .
							止まる（とまる）︓dừng lại, giữ lại.
							禁止（きんし）︓cấm chỉ.
							止す（よす）︓bỏ học, đình chỉ.
							止血剤（しけつざい）︓thuốc cầm máu.
							`,
			source: 'Nam NV',
		},
		{
			id: 88,
			text: `送 : Tống .
							Âm on : そう.
							Âm kun : おく-る.
							Những từ hay gặp .
							輸送費（ゆそうひ）︓phí vận chuyển.
							送る（おくる）︓gửi.
							送り主（おくりぬし）︓người gửi.
							`,
			source: 'Nam NV',
		},
		{
			id: 89,
			text: `切 : Thiết .
							Âm on : せつ.
							Âm kun : き-る,
							き-り,
							き-れる,
							きれ.
							Những từ hay gặp .
							切る（きる）︓cắt.
							大切（たいせつ）︓quan trọng.
							売り切れ（うりきれ）︓bán hết.
							親切（しんせつ）︓tốt bụng.
							`,
			source: 'Nam NV',
		},
		{
			id: 90,
			text: `転 : Chuyển .
							Âm on : てん.
							Âm kun : ころ-がる,
							ころ-げる,
							ころ-がす,
							ころ-ぶ,
							まろ-ぶ,
							うたた,
							うつ-る.
							Những từ hay gặp .
							運転（うんてん）︓vận hành.
							自転車（じてんしゃ）︓xe đạp.
							転がる（ころがる）︓ngã, đổ nhào.
							`,
			source: 'Nam NV',
		},
		{
			id: 91,
			text: `研 : Nghiên .
								Âm on : けん.
								Âm kun .
								Những từ hay gặp .
								研究（けんきゅう）︓nghiên cứu.
								`,
			source: 'Nam NV',
		},
		{
			id: 92,
			text: `足 : Túc .
								Âm on : そく.
								Âm kun : あし.
								た-りる.
								た-る.
								た-す.
								Những từ hay gặp .
								手足（てあし）︓chân tay.
								足りる（たりる）︓đủ.
								足入れ（あしいれ）︓kết hôn không chính thức.
								`,
			source: 'Nam NV',
		},
		{
			id: 93,
			text: `究 : Cứu .
								Âm on : きゅう.
								Âm kun .
								Những từ hay gặp .
								研究（けんきゅう）︓nghiên cứu.
								考究（こうきゅう）︓khảo cứu.
								`,
			source: 'Nam NV',
		},
		{
			id: 94,
			text: `楽 : Lạc .
								Âm on : がく.
								らく.
								Âm kun : たの-しい.
								たの-しむ.
								Những từ hay gặp .
								音楽（おんがく）︓âm nhạc.
								楽しい（たのしい）︓vui vẻ.
								楽観的（らっかんてき）︓lạc quan.
								`,
			source: 'Nam NV',
		},
		{
			id: 95,
			text: `起 : Khởi .
								Âm on : き.
								Âm kun : お-きる.
								お-こる.
								お-こす.
								た-つ.
								Những từ hay gặp .
								起きる（起きる）︓thức dậy.
								`,
			source: 'Nam NV',
		},
		{
			id: 96,
			text: `着 : Trứ, trước, trữ .
								Âm on : ちゃく.
								じゃく.
								Âm kun : き-る.
								き-せる.
								つ-く.
								つ-ける.
								Những từ hay gặp .
								着物（きもの）︓Kimono, quần áo truyền thống của Nhật.
								着信メール（ちゃくしん）︓thư gửi đến着る（きる）︓.
								mặc.
								`,
			source: 'Nam NV',
		},
		{
			id: 97,
			text: `店 : Điếm .
								Âm on : てん.
								Âm kun : みせ.
								たな.
								Những từ hay gặp .
								店（みせ）︓cửa hàng.
								店員（てんいん）︓nhân viên cửa hàng.
								百貨店（ひゃっかてん）︓cửa hàng bách hóa.
								`,
			source: 'Nam NV',
		},
		{
			id: 98,
			text: `病 : Bệnh .
								Âm on : びょう.
								Âm kun : や-む.
								やまい.
								Những từ hay gặp .
								病気（びょうき）︓bệnh tật.
								病院（びょういん）︓bệnh viện.
								病人（びょうにん）︓bệnh nhân.
								`,
			source: 'Nam NV',
		},
		{
			id: 99,
			text: `質 : Chất .
								Âm on : しつ.
								Âm kun : たち.
								ただ-す.
								Những từ hay gặp .
								質問（しつもん）︓câu hỏi.
								質（しつ）︓chất lượng.
								悪質（あくしつ）︓chất lượng kém.
								`,
			source: 'Nam NV',
		},
		{
			id: 100,
			text: `待 : Đãi .
								Âm on : たい.
								てい.
								Âm kun : ま-つ.
								Những từ hay gặp .
								待つ（まつ）︓đợi.
								招待（しょうたい）︓tiếp đãi.
								期待（きたい）︓kì vọng.
								`,
			source: 'Nam NV',
		},
		{
			id: 101,
			text: `試 : Thí .
			Âm on : し.
			Âm kun : こころ-みる.
			ため-す.
			Những từ hay gặp .
			試みる（こころみる）︓thử.
			試合（しあい）︓trận chiến.
			試験（しけん）︓kiểm tra.
			`,
			source: 'Nam NV',
		},
		{
			id: 102,
			text: `族 : Tộc .
			Âm on : ぞく.
			Âm kun .
			Những từ hay gặp .
			家族（かぞく）︓gia đình.
			民族（みんぞく）︓dân tộc.
			水族館（すいぞくかん）︓ống dẫn nước.
			`,
			source: 'Nam NV',
		},
		{
			id: 103,
			text: `銀 : Ngân .
			Âm on : ぎん.
			Âm kun .
			Những từ hay gặp .
			銀行（ぎんこう）︓ngân hàng.
			`,
			source: 'Nam NV',
		},
		{
			id: 104,
			text: `早 : Tảo .
			Âm on : そう.
			Âm kun : はや-い.
			はや-く.
			はや-まる.
			はや-める.
			Cách Nhớ：.
			Những từ hay gặp .
			早い（はやい）︓nhanh.
			早起き（はやおき）︓dậy sớm.
			`,
			source: 'Nam NV',
		},
		{
			id: 105,
			text: `映 : Ánh .
			Âm on : えい.
			Âm kun : うつ-る.
			うつ-す.
			は-える.
			Những từ hay gặp .
			映画（えいが）︓phim rạp.
			映る（うつる）︓chiếu chụp.
			映画館（えいがかん）︓rạp chiếu phim.
			`,
			source: 'Nam NV',
		},
		{
			id: 106,
			text: `親 : Thân .
			Âm on : しん.
			Âm kun : おや.
			した-しい.
			Những từ hay gặp .
			両親（りょうしん）︓bố mẹ.
			親切（しんせつ）︓tốt bụng.
			母親（ははおや）︓mẹ.
			`,
			source: 'Nam NV',
		},
		{
			id: 107,
			text: `験 : Nghiệm .
			Âm on : けん.
			げん.
			Âm kun : あかし.
			しるし.
			ため-す.
			ためし.
			Những từ hay gặp .
			試験（しけん）︓kiểm tra.
			経験（けいけん）︓kinh nghiệm.
			`,
			source: 'Nam NV',
		},
		{
			id: 108,
			text: `英 : Anh .
			Âm on : えい.
			Âm kun .
			Những từ hay gặp .
			英語（えいご）︓tiếng Anh.
			英国（えいこく）︓nước Anh.
			英雄（えいゆう）︓anh hùng.
			`,
			source: 'Nam NV',
		},
		{
			id: 109,
			text: `医 : Y .
			Âm on : い.
			Âm kun .
			Những từ hay gặp .
			医者（いしゃ）︓bác sỹ.
			医師（いし）︓y sỹ.
			歯医者（はいしゃ）︓nha sỹ.
			`,
			source: 'Nam NV',
		},
		{
			id: 110,
			text: `仕 : Sĩ .
			Âm on : し.
			じ.
			Âm kun : つか-える.
			Những từ hay gặp .
			仕事（しごと）︓công việc.
			仕上げる（しあげる）︓hoàn thành.
			仕方が無い（しかたがない）︓không còn cách nào khác.
			`,
			source: 'Nam NV',
		},
		{
			id: 111,
			text: `去 : Khứ .
			Âm on : きょ.
			こ.
			さく.
			Âm kun : さ-る.
			Những từ hay gặp .
			去年（きょねん）︓năm ngoái.
			昨日（さくねん）︓hôm qua.
			過去（かこ）︓quá khứ.
			`,
			source: 'Nam NV',
		},
		{
			id: 112,
			text: `味 : Vị .
			Âm on : み.
			Âm kun : あじ.
			あじ-わう.
			Những từ hay gặp .
			調味料（ちょうみりょう）︓gia vị.
			意味（いみ）︓ý nghĩa.
			興味（きょうみ）︓sở thích.
			`,
			source: 'Nam NV',
		},
		{
			id: 113,
			text: `写 : Tả .
			Âm on : しゃ.
			じゃ.
			Âm kun : うつ-す.
			うつ-る.
			Những từ hay gặp .
			写す（うつす）︓chụp, copy.
			写真（しゃしん）︓ảnh.
			`,
			source: 'Nam NV',
		},
		{
			id: 114,
			text: `字 : Tự .
			Âm on : じ.
			Âm kun : あざ.
			あざな.
			〜な.
			Những từ hay gặp .
			漢字（かんじ）︓chữ Hán.
			字典（じてん）︓từ điển.
			習字（しゅうじ）︓luyện chữ.
			`,
			source: 'Nam NV',
		},
		{
			id: 115,
			text: `答 : Đáp .
			Âm on : とう.
			Âm kun : こた-える.
			Những từ hay gặp .
			答え（こたえ）︓câu trả lời.
			返答（へんとう）︓trả lời.
			`,
			source: 'Nam NV',
		},
		{
			id: 116,
			text: `夜 : Dạ .
			Âm on : や.
			しょ.
			Âm kun : よ.
			よる.
			Những từ hay gặp .
			今夜（こんや）︓tối nay.
			夜会（やかい）︓dạ hội.
			`,
			source: 'Nam NV',
		},
		{
			id: 117,
			text: `音 : Âm .
			Âm on : おん.
			Âm kun : おと.
			Những từ hay gặp .
			音楽（おんがく）︓âm nhạc.
			音（おと）︓âm.
			騒音（そうおん）︓ô nhiễm tiếng ồn.
			`,
			source: 'Nam NV',
		},
		{
			id: 118,
			text: `注 : Chú .
			Âm on : ちゅう.
			Âm kun : そそ-ぐ.
			さ-す.
			つ-ぐ.
			Những từ hay gặp .
			注意（ちゅうい）︓chú ý.
			注射（ちゅうしゃ）︓tiêm.
			`,
			source: 'Nam NV',
		},
		{
			id: 119,
			text: `帰 : Quy .
			Âm on : き.
			Âm kun : かえ-る.
			かえ-す.
			おく-る.
			とつ-ぐ.
			Những từ hay gặp .
			帰国（きこく）︓về nước.
			お帰りなさい（おかえりなさい）︓anh (bác, bố…) đã về.
			(rồi ạ).
			帰宅（きたく）︓về nhà.
			`,
			source: 'Nam NV',
		},
		{
			id: 120,
			text: `古 : Cổ .
			Âm on : こ.
			Âm kun : ふる-い.
			Những từ hay gặp .
			中古（ちゅうこ）︓đồ qua sử dụng rồi.
			古い（ふるい）︓cũ.
			古代（こだい）︓cổ đại.
			`,
			source: 'Nam NV',
		},
		{
			id: 121,
			text: `歌 : Ca .
			Âm on : か.
			Âm kun : うた.
			うた-う.
			Những từ hay gặp .
			歌手（かしゅ）︓ca sỹ.
			和歌山県（わかやまけん）-tỉnh Wakayama.
			`,
			source: 'Nam NV',
		},
		{
			id: 122,
			text: `買 : Mãi .
			Âm on : ばい.
			Âm kun : か-う.
			Những từ hay gặp .
			買い物（かいもの）︓đi mua sắm.
			売買（ばいばい）︓mua bán.
			`,
			source: 'Nam NV',
		},
		{
			id: 123,
			text: `悪 : Ác .
			Âm on : あく.
			Âm kun : わる-い.
			あ-し.
			にく-い.
			Những từ hay gặp .
			悪意（あくい）︓ác ý.
			悪い（わるい）︓xấu.
			`,
			source: 'Nam NV',
		},
		{
			id: 124,
			text: `図 : Đồ .
			Âm on : ず.
			と.
			Âm kun : え.
			Những từ hay gặp .
			地図（ちず）︓bản đồ.
			図書館（としょかん）︓thư viện.
			`,
			source: 'Nam NV',
		},
		{
			id: 125,
			text: `週 : Chu .
			Âm on : しゅう.
			Âm kun .
			Những từ hay gặp .
			一週（いっしゅう）︓một tuần.
			来週（らいしゅう）︓tuần tới.
			今週（こんしゅう）︓tuần trước.
			`,
			source: 'Nam NV',
		},
		{
			id: 126,
			text: `室 : Thất .
			Âm on : しつ.
			Âm kun : むろ.
			Những từ hay gặp .
			教室（きょうしつ）︓giảng đường.
			事務室（じむしつ）︓văn phòng.
			待合室（まちあいしつ）︓phòng chờ.
			`,
			source: 'Nam NV',
		},
		{
			id: 127,
			text: `歩 : Bộ .
			Âm on : ほ.
			ぽ.
			Âm kun : ある-く.
			Những từ hay gặp .
			散歩（さんぽ）︓tản bộ.
			横断歩道（おうだんほどう）︓vạch kẻ sang đường.
			進歩（しんぽ）︓tiến bộ.
			`,
			source: 'Nam NV',
		},
		{
			id: 128,
			text: `風 : Phong .
			Âm on : ふう.
			ふ.
			Âm kun : かぜ.
			Những từ hay gặp .
			風景（ふうけい）︓phong cảnh.
			台風（たいふう）︓bão.
			洋風（ようふう）︓kiểu tây.
			風鈴（ふうりん）︓chuông gió.
			`,
			source: 'Nam NV',
		},
		{
			id: 129,
			text: `紙 : Chỉ .
			Âm on : し.
			Âm kun : かみ.
			Những từ hay gặp .
			紙（かみ）︓giấy.
			和紙（わし）︓giấy Nhật.
			`,
			source: 'Nam NV',
		},
		{
			id: 130,
			text: `黒 : Hắc .
			Âm on : こく.
			Âm kun : くろ.
			くろ-ずむ.
			くろ-い.
			Những từ hay gặp .
			黒い（くろい）︓đen.
			真っ黒（まっくろ）︓đen tuyền.
			黒板（こくばん）︓bảng đen.
			`,
			source: 'Nam NV',
		},
		{
			id: 131,
			text: `花 : Hoa .
			Âm on : か.
			け.
			Âm kun : はな.
			Những từ hay gặp .
			生け花（いけばな）︓nghệ thuật cắm hoa.
			花火（はなび）︓pháp hoa.
			火事（かじ）︓hỏa hoạn.
			`,
			source: 'Nam NV',
		},
		{
			id: 132,
			text: `春 : Xuân .
			Âm on : しゅん.
			Âm kun : はる.
			Những từ hay gặp .
			春（はる）︓mùa xuân.
			春分（しゅんぶん）︓xuân phân.
			`,
			source: 'Nam NV',
		},
		{
			id: 133,
			text: `赤 : Xích .
			Âm on : せき.
			Âm kun : あか.
			あか-い.
			あか-らむ.
			Những từ hay gặp .
			赤道（せきどう）︓xích đạo.
			赤ちゃん（あかちゃん）︓trẻ nhỏ.
			赤い（あかい）︓đỏ.
			`,
			source: 'Nam NV',
		},
		{
			id: 134,
			text: `青 : Thanh .
			Âm on : せい.
			しょう.
			Âm kun : あお.
			あお-い.
			Những từ hay gặp .
			青空（あおぞら）︓trời trong xanh.
			青年（せいねん）︓thanh niên.
			`,
			source: 'Nam NV',
		},
		{
			id: 135,
			text: `館 : Quán .
			Âm on : かん.
			Âm kun : やかた.
			Những từ hay gặp .
			図書館（としょかん）︓thư viện.
			大使館（たいしかん）︓đại sứ quán.
			`,
			source: 'Nam NV',
		},
		{
			id: 136,
			text: `屋 : Ốc .
			Âm on : おく.
			Âm kun : や.
			Những từ hay gặp .
			八百屋（やおや）︓cửa hàng rau.
			屋上（おくじょう）︓sân thượng.
			酒屋（さかや）︓hàng rượu.
			`,
			source: 'Nam NV',
		},
		{
			id: 137,
			text: `色 : Sắc .
			Âm on : しょく.
			しき.
			Âm kun : いろ.
			Những từ hay gặp .
			特色（とくしょく）︓đặc sắc.
			茶色（ちゃいろ）︓màu nâu.
			景色（けしき）︓cảnh sắc.
			`,
			source: 'Nam NV',
		},
		{
			id: 138,
			text: `走 : Tẩu .
			Âm on : そう.
			Âm kun : はし-る.
			Những từ hay gặp .
			走る（はしる）︓chạy.
			走り書き（はしりがき）︓chữ viết láu.
			`,
			source: 'Nam NV',
		},
		{
			id: 139,
			text: `秋 : Thu .
			Âm on : しゅう.
			Âm kun : あき.
			Những từ hay gặp .
			秋田県（あきたけん）︓tỉnh Akita.
			秋分の日（しゅうぶんのひ）︓ngày Thu phân.
			`,
			source: 'Nam NV',
		},
		{
			id: 140,
			text: `夏 : Hạ .
			Âm on : か.
			Âm kun : なつ.
			Những từ hay gặp .
			夏休み（なつやすみ）︓nghỉ hè.
			夏祭り（なつまつり）︓lễ hội hè.
			夏服（なつふく）︓quần áo hè.
			`,
			source: 'Nam NV',
		},
		{
			id: 141,
			text: `習 : Tập .
			Âm on : しゅう.
			Âm kun : なら-う.
			なら-い.
			Những từ hay gặp .
			習う（ならう）︓học.
			習慣（しゅうかん）︓tập quán.
			復習（ふくしゅう）︓ôn tập.
			`,
			source: 'Nam NV',
		},
		{
			id: 142,
			text: `駅 : Dịch .
			Âm on : えき.
			Âm kun .
			Những từ hay gặp .
			駅長（えきちょう）︓trưởng ga.
			駅名（えきめい）︓tên ga.
			`,
			source: 'Nam NV',
		},
		{
			id: 143,
			text: `洋 : Dương .
			Âm on : よう.
			Âm kun .
			Những từ hay gặp .
			西洋（せいよう）︓Phương Tây.
			東洋（とうよう）︓Phương Đông.
			洋服（ようふく）︓âu phục.
			`,
			source: 'Nam NV',
		},
		{
			id: 144,
			text: `旅 : Lữ .
			Âm on : りょ.
			Âm kun : たび.
			Những từ hay gặp .
			旅行（りょこう）︓du lịch.
			旅（たび）︓du lịch.
			`,
			source: 'Nam NV',
		},
		{
			id: 145,
			text: `服 : Phục .
			Âm on : ふく.
			Âm kun .
			Những từ hay gặp .
			洋服（ようふく）︓âu phục.
			和服（わふく）︓quàn áo truyền thống Nhật.
			衣服（いふく）︓y phục.
			`,
			source: 'Nam NV',
		},
		{
			id: 146,
			text: `夕 : Tịch .
			Âm on : せき.
			Âm kun : ゆう.
			Những từ hay gặp .
			夕方（ゆうがた）︓chiều tối.
			夕日（ゆうひ）︓mặt trời lúc hoàng hôn.
			七夕（たなばな）︓ngày lễ Tanabata （７/７）.
			`,
			source: 'Nam NV',
		},
		{
			id: 147,
			text: `借 : Tá .
			Âm on : しゃく.
			Âm kun : か-りる.
			Những từ hay gặp .
			借りる（かりる）︓vay mượn.
			借金（しゃっきん）︓tiền vay.
			`,
			source: 'Nam NV',
		},
		{
			id: 148,
			text: `曜 : Diệu .
			Âm on : よう.
			Âm kun .
			Những từ hay gặp .
			日曜日（にちようび）︓chủ nhật.
			火曜日（かようび）︓thứ 3.
			`,
			source: 'Nam NV',
		},
		{
			id: 149,
			text: `飲 : Ẩm.
			Âm on : いん.
			Âm kun : の-む.
			Những từ hay gặp .
			飲む（のむ）︓uống.
			飲食（いんしょく）︓ẩm thực.
			`,
			source: 'Nam NV',
		},
		{
			id: 150,
			text: `肉 : Nhục .
			Âm on : にく.
			Âm kun .
			Những từ hay gặp .
			鶏肉（とりにく）︓thịt gà.
			牛肉（ぎゅうにく）︓thịt bò.
			`,
			source: 'Nam NV',
		},
		{
			id: 151,
			text: `貸 : Thải  .
			Âm on : たい.
			てい.
			Âm kun : か-す.
			Những từ hay gặp  .
			貸家（かしいえ）︓nhà cho thuê.
			貸す（かす）︓cho vay.
			`,
			source: 'Nam NV',
		},
		{
			id: 152,
			text: `堂 : Đường  .
			Âm on : どう.
			Âm kun  .
			Những từ hay gặp  .
			食堂（しょくどう）︓nhà ăn.
			講堂（こうどう）︓giảng đường.
			`,
			source: 'Nam NV',
		},
		{
			id: 153,
			text: `鳥 : Điểu  .
			Âm on : ちょう.
			Âm kun : とり.
			Những từ hay gặp  .
			小鳥（ことり）︓chim nhỏ.
			白鳥（はくちょう）︓thiên nga.
			`,
			source: 'Nam NV',
		},
		{
			id: 154,
			text: `飯 : Phạn  .
			Âm on : はん.
			Âm kun  .
			Những từ hay gặp  .
			夕飯（ゆうはん）︓cơm chiều.
			ご飯（ごはん）︓cơm.
			`,
			source: 'Nam NV',
		},
		{
			id: 155,
			text: `勉 : Miễn  .
			Âm on : べん.
			Âm kun  .
			Những từ hay gặp  .
			勉強（べんきょう）︓học hành.
			`,
			source: 'Nam NV',
		},
		{
			id: 156,
			text: `冬 : Đông  .
			Âm on : とう.
			Âm kun : ふゆ.
			Những từ hay gặp  .
			冬休み（ふゆやすみ）︓nghỉ đông.
			春夏秋冬（しゅんかしゅうとう）︓xuân hạ thu đông.
			`,
			source: 'Nam NV',
		},
		{
			id: 157,
			text: `昼 : Trú  .
			Âm on : ちゅう.
			Âm kun : ひる.
			Những từ hay gặp  .
			昼ご飯（ひるごはん）︓cơm trưa.
			昼休み（ひるやすみ）︓nghỉ trưa.
			昼食（ちゅうしょく）︓ăn trưa.
			`,
			source: 'Nam NV',
		},
		{
			id: 158,
			text: `茶 : Trà  .
			Âm on : ちゃ.
			Âm kun  .
			Những từ hay gặp  .
			茶色（ちゃいろ）︓màu nâu.
			紅茶（こうちゃ）︓hồng trà.
			茶碗（ちゃわん）︓chén trà.
			`,
			source: 'Nam NV',
		},
		{
			id: 159,
			text: `弟 : Đệ  .
			Âm on : だい.
			Âm kun : おとうと.
			Những từ hay gặp  .
			弟さん（おとうとさん）︓em trai.
			兄弟（きょうだい）︓anh em.
			`,
			source: 'Nam NV',
		},
		{
			id: 160,
			text: `牛 : Ngưu .
			Âm on : ぎゅう.
			Âm kun : うし.
			Những từ hay gặp  .
			牛肉（ぎゅうにく）︓thịt bò.
			牛乳（ぎゅうにく）︓sữa bò.
			`,
			source: 'Nam NV',
		},
		{
			id: 161,
			text: `魚 : Ngư .
			Âm on : ぎょ.
			Âm kun : さかな.
			Những từ hay gặp .
			魚（さかな）︓cá.
			金魚（きんぎょ）︓cá vàng.
			`,
			source: 'Nam NV',
		},
		{
			id: 162,
			text: `兄 : Huynh .
			Âm on : けい.
			きょう.
			Âm kun : あに.
			Những từ hay gặp .
			お兄さん（おにいさん）︓anh trai.
			兄弟（きょうだい）︓anh em.
			`,
			source: 'Nam NV',
		},
		{
			id: 163,
			text: `犬 : Tuất .
			Âm on : けん.
			Âm kun : いぬ.
			Những từ hay gặp .
			犬（いぬ）︓chó.
			番犬（ばんけん）︓chó giữ nhà.
			`,
			source: 'Nam NV',
		},
		{
			id: 164,
			text: `妹 : Muội .
			Âm on : まい.
			Âm kun : いもうと.
			Những từ hay gặp .
			妹さん（いもうとさん）︓em gái.
			姉妹- chị em.
			`,
			source: 'Nam NV',
		},
		{
			id: 165,
			text: `姉 : Tỷ .
			Âm on : し.
			Âm kun : あね.
			Những từ hay gặp .
			お姉さん（おねえさん）︓chị gá.
			i姉妹（しまい）︓chị em.
			`,
			source: 'Nam NV',
		},
		{
			id: 166,
			text: `漢 : Hán .
			Âm on : かん.
			Âm kun .
			Những từ hay gặp .
			漢字（かんじ）︓chữ Hán.
			漢方薬（かんぽうやく）︓thuốc gốc Trung Quốc.
			`,
			source: 'Nam NV',
		},















	];

    function areNewFeaturesAvailable(state) {
        return config.newFeatureIncrement > state.featureIncrement;
    }
    function getBuiltinQuotes(state) {
        if (!state.builtinQuotesEnabled)
            return [];
        return BuiltinQuotes.filter(quote => state.hiddenBuiltinQuotes.indexOf(quote.id) === -1);
    }
    function currentQuote(state) {
        const emptyQuote = { id: null, text: 'No quotes found!', source: '' };
        if (state.currentQuoteID == null)
            return emptyQuote;
        if (state.isCurrentQuoteCustom) {
            return (state.customQuotes.find(quote => quote.id === state.currentQuoteID) ||
                emptyQuote);
        }
        else {
            return (BuiltinQuotes.find(quote => quote.id === state.currentQuoteID) ||
                emptyQuote);
        }
    }

    var ActionTypes$1;
    (function (ActionTypes) {
        ActionTypes[ActionTypes["TOGGLE_SHOW_QUOTES"] = 'TOGGLE_SHOW_QUOTES'] = "TOGGLE_SHOW_QUOTES";
        ActionTypes[ActionTypes["TOGGLE_BUILTIN_QUOTES"] = 'TOGGLE_BUILTIN_QUOTES'] = "TOGGLE_BUILTIN_QUOTES";
        ActionTypes[ActionTypes["SELECT_NEW_QUOTE"] = 'SELECT_NEW_QUOTE'] = "SELECT_NEW_QUOTE";
        ActionTypes[ActionTypes["HIDE_QUOTE"] = 'HIDE_QUOTE'] = "HIDE_QUOTE";
        ActionTypes[ActionTypes["DELETE_QUOTE"] = 'DELETE_QUOTE'] = "DELETE_QUOTE";
        ActionTypes[ActionTypes["ADD_QUOTE"] = 'ADD_QUOTE'] = "ADD_QUOTE";
        ActionTypes[ActionTypes["ADD_QUOTES_BULK"] = 'ADD_QUOTES_BULK'] = "ADD_QUOTES_BULK";
        ActionTypes[ActionTypes["RESET_HIDDEN_QUOTES"] = 'RESET_HIDDEN_QUOTES'] = "RESET_HIDDEN_QUOTES";
    })(ActionTypes$1 || (ActionTypes$1 = {}));
    var Actions = ActionTypes$1;
    function generateID() {
        let key = '';
        while (key.length < 16) {
            key += Math.random()
                .toString(16)
                .substr(2);
        }
        return key.substr(0, 16);
    }
    function hideInfoPanel() {
        return {
            type: 'INFO_PANEL_SHOW',
            show: 'HIDE',
        };
    }
    function showInfoPanel() {
        return {
            type: 'INFO_PANEL_SHOW',
            show: 'SHOW',
        };
    }
    function toggleShowQuotes() {
        return {
            type: ActionTypes$1.TOGGLE_SHOW_QUOTES,
        };
    }
    function toggleBuiltinQuotes() {
        return dispatch => {
            dispatch({
                type: ActionTypes$1.TOGGLE_BUILTIN_QUOTES,
            });
            dispatch(selectNewQuote());
        };
    }
    function addQuote(text, source) {
        const id = generateID();
        return dispatch => {
            dispatch({
                type: ActionTypes$1.ADD_QUOTE,
                id,
                text,
                source,
            });
            dispatch(cancelEditing());
        };
    }
    function resetHiddenQuotes() {
        return {
            type: ActionTypes$1.RESET_HIDDEN_QUOTES,
        };
    }
    function removeCurrentQuote() {
        return (dispatch, getState) => {
            const state = getState();
            if (state.isCurrentQuoteCustom) {
                dispatch({
                    type: ActionTypes$1.DELETE_QUOTE,
                    id: state.currentQuoteID,
                });
            }
            else {
                dispatch({
                    type: ActionTypes$1.HIDE_QUOTE,
                    id: state.currentQuoteID,
                });
            }
            dispatch(selectNewQuote());
        };
    }
    function selectNewQuote() {
        return (dispatch, getState) => {
			const state = getState();
			const builtinQuotes = getBuiltinQuotes(state);
			const customQuotes = state.customQuotes;
			const allQuotes = builtinQuotes.concat(customQuotes);
			if (allQuotes.length < 1) {
				return dispatch({
					type: ActionTypes$1.SELECT_NEW_QUOTE,
					isCustom: false,
					id: null,
				});
			}
			const quoteIndex = Math.floor(Math.random() * allQuotes.length);
			next = quoteIndex;
			dispatch({
				type: ActionTypes$1.SELECT_NEW_QUOTE,
				isCustom: quoteIndex >= builtinQuotes.length,
				id: allQuotes[quoteIndex].id,
			});
		};
    }
    function setQuoteText(text) {
        return {
            type: 'QUOTE_EDIT',
            action: { type: 'SET_TEXT', text: text },
        };
    }
    function setQuoteSource(source) {
        return {
            type: 'QUOTE_EDIT',
            action: { type: 'SET_SOURCE', source },
        };
    }
    function startEditing() {
        return {
            type: 'QUOTE_EDIT',
            action: { type: 'START' },
        };
    }
    function cancelEditing() {
        return {
            type: 'QUOTE_EDIT',
            action: { type: 'CANCEL' },
        };
    }
    const menuHide = () => ({
        type: 'QUOTE_MENU_SHOW',
        show: 'HIDE',
    });
    const menuToggle = () => ({
        type: 'QUOTE_MENU_SHOW',
        show: 'TOGGLE',
    });
    function toggleBulkEdit() {
        return {
            type: 'QUOTE_EDIT',
            action: { type: 'TOGGLE_BULK' },
        };
    }
    function addQuotesBulk(text) {
        return dispatch => {
            const lines = text.split('\n');
            const quotes = [];
            for (var lineCount = 0; lineCount < lines.length; lineCount++) {
                const line = lines[lineCount];
                const quote = line.split('~');
                const trimmedQuote = [];
                if (quote.length === 0 || quote[0].trim() === '') ;
                else if (quote.length !== 2) {
                    return dispatch({
                        type: 'PARSE_ERROR',
                        message: `Invalid format on line ${(lineCount + 1).toString()}: \"${quote}\"`,
                    });
                }
                else {
                    quote.forEach(field => trimmedQuote.push(field.trim()));
                    quotes.push(trimmedQuote);
                }
            }
            quotes.forEach(trimmedQuote => {
                dispatch({
                    type: ActionTypes$1.ADD_QUOTE,
                    id: generateID(),
                    text: trimmedQuote[0],
                    source: trimmedQuote[1],
                });
            });
            dispatch(cancelEditing());
        };
    }

    function showQuotes(state = true, action) {
        switch (action.type) {
            case Actions.TOGGLE_SHOW_QUOTES:
                return !state;
        }
        return state;
    }
    function builtinQuotesEnabled(state = true, action) {
        switch (action.type) {
            case Actions.TOGGLE_BUILTIN_QUOTES:
                return !state;
        }
        return state;
    }
    function showInfoPanel$1(state = false, action) {
        switch (action.type) {
            case 'INFO_PANEL_SHOW':
                switch (action.show) {
                    case 'SHOW':
                        return true;
                    case 'HIDE':
                        return false;
                    case 'TOGGLE':
                        return !state;
                }
        }
        return state;
    }
    function featureIncrement(state = 0, action) {
        switch (action.type) {
            case 'INFO_PANEL_SHOW':
                switch (action.show) {
                    case 'SHOW':
                        return config.newFeatureIncrement;
                }
        }
        return state;
    }
    function isCurrentQuoteCustom(state = null, action) {
        switch (action.type) {
            case Actions.SELECT_NEW_QUOTE:
                return action.isCustom;
            case Actions.ADD_QUOTE:
                return true;
        }
        return state;
    }
    function currentQuoteID(state = null, action) {
        switch (action.type) {
            case Actions.SELECT_NEW_QUOTE:
                return action.id;
            case Actions.ADD_QUOTE:
                return action.id;
        }
        return state;
    }
    function hiddenBuiltinQuotes(state = [], action) {
        switch (action.type) {
            case Actions.HIDE_QUOTE:
                if (action.id == null)
                    return state;
                return state.concat([action.id]);
            case Actions.RESET_HIDDEN_QUOTES:
                return [];
        }
        return state;
    }
    function customQuotes(state = [], action) {
        switch (action.type) {
            case Actions.ADD_QUOTE:
                return state.concat([
                    {
                        id: action.id,
                        text: action.text,
                        source: action.source,
                    },
                ]);
            case Actions.DELETE_QUOTE:
                if (action.id == null)
                    return state;
                return state.filter(quote => quote.id !== action.id);
        }
        return state;
    }
    const editingText = (state = '', action) => {
        switch (action.type) {
            case 'QUOTE_EDIT':
                switch (action.action.type) {
                    case 'START':
                        return '';
                    case 'CANCEL':
                        return '';
                    case 'SET_TEXT':
                        return action.action.text;
                    case 'TOGGLE_BULK':
                        return '';
                }
        }
        return state;
    };
    const editingSource = (state = '', action) => {
        switch (action.type) {
            case 'QUOTE_EDIT':
                switch (action.action.type) {
                    case 'START':
                        return '';
                    case 'CANCEL':
                        return '';
                    case 'SET_SOURCE':
                        return action.action.source;
                }
        }
        return state;
    };
    const isQuoteMenuVisible = (state = false, action) => {
        switch (action.type) {
            case 'QUOTE_MENU_SHOW':
                switch (action.show) {
                    case 'SHOW':
                        return true;
                    case 'HIDE':
                        return false;
                    case 'TOGGLE':
                        return !state;
                }
        }
        return state;
    };
    const isEditingQuote = (state = false, action) => {
        switch (action.type) {
            case 'QUOTE_EDIT':
                switch (action.action.type) {
                    case 'START':
                        return true;
                    case 'CANCEL':
                        return false;
                }
        }
        return state;
    };
    const isEditingBulk = (state = false, action) => {
        switch (action.type) {
            case 'QUOTE_EDIT':
                switch (action.action.type) {
                    case 'TOGGLE_BULK':
                        return !state;
                }
        }
        return state;
    };
    const error = (state = '', action) => {
        switch (action.type) {
            case 'QUOTE_EDIT':
                switch (action.action.type) {
                    case 'CANCEL':
                        return '';
                }
                return state;
            case 'PARSE_ERROR':
                return action.message;
        }
        return state;
    };
    var rootReducer = combineReducers({
        showQuotes,
        builtinQuotesEnabled,
        showInfoPanel: showInfoPanel$1,
        featureIncrement,
        isCurrentQuoteCustom,
        currentQuoteID,
        hiddenBuiltinQuotes,
        customQuotes,
        editingSource,
        editingText,
        isQuoteMenuVisible,
        isEditingQuote,
        isEditingBulk,
        error,
    });

    function saveSettings$1(state) {
        const data = {
            showQuotes: state.showQuotes,
            builtinQuotesEnabled: state.builtinQuotesEnabled,
            featureIncrement: state.featureIncrement,
            hiddenBuiltinQuotes: state.hiddenBuiltinQuotes,
            customQuotes: state.customQuotes,
        };
        saveSettings(data);
    }
    function createStore$1() {
        return new Promise(resolve => {
            loadSettings((initialState) => {
                const store = createStore(rootReducer, initialState, applyMiddleware(thunk));
                store.dispatch(selectNewQuote());
                store.subscribe(() => {
                    saveSettings$1(store.getState());
                });
                resolve(store);
            });
        });
    }

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var vnode_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function vnode(sel, data, children, text, elm) {
        var key = data === undefined ? undefined : data.key;
        return { sel: sel, data: data, children: children,
            text: text, elm: elm, key: key };
    }
    exports.vnode = vnode;
    exports.default = vnode;

    });

    unwrapExports(vnode_1);
    var vnode_2 = vnode_1.vnode;

    var is = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.array = Array.isArray;
    function primitive(s) {
        return typeof s === 'string' || typeof s === 'number';
    }
    exports.primitive = primitive;

    });

    unwrapExports(is);
    var is_1 = is.array;
    var is_2 = is.primitive;

    var h_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });


    function addNS(data, children, sel) {
        data.ns = 'http://www.w3.org/2000/svg';
        if (sel !== 'foreignObject' && children !== undefined) {
            for (var i = 0; i < children.length; ++i) {
                var childData = children[i].data;
                if (childData !== undefined) {
                    addNS(childData, children[i].children, children[i].sel);
                }
            }
        }
    }
    function h(sel, b, c) {
        var data = {}, children, text, i;
        if (c !== undefined) {
            data = b;
            if (is.array(c)) {
                children = c;
            }
            else if (is.primitive(c)) {
                text = c;
            }
            else if (c && c.sel) {
                children = [c];
            }
        }
        else if (b !== undefined) {
            if (is.array(b)) {
                children = b;
            }
            else if (is.primitive(b)) {
                text = b;
            }
            else if (b && b.sel) {
                children = [b];
            }
            else {
                data = b;
            }
        }
        if (children !== undefined) {
            for (i = 0; i < children.length; ++i) {
                if (is.primitive(children[i]))
                    children[i] = vnode_1.vnode(undefined, undefined, undefined, children[i], undefined);
            }
        }
        if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
            (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
            addNS(data, children, sel);
        }
        return vnode_1.vnode(sel, data, children, text, undefined);
    }
    exports.h = h;
    exports.default = h;

    });

    unwrapExports(h_1);
    var h_2 = h_1.h;

    const QuoteEditor = (store) => {
        const state = store.getState();
        const text = state.editingText;
        const source = state.editingSource;
        const isEditingBulk = state.isEditingBulk;
        const errorMessage = state.error;
        const onChangeText = e => {
            store.dispatch(setQuoteText(e.target.value));
        };
        const onChangeSource = e => {
            store.dispatch(setQuoteSource(e.target.value));
        };
        const onSave = () => {
            if (!isEditingBulk) {
                store.dispatch(addQuote(text, source));
            }
            else {
                store.dispatch(addQuotesBulk(text));
            }
        };
        const onCancel = () => {
            store.dispatch(cancelEditing());
        };
        const onCheckboxToggle = e => {
            store.dispatch(toggleBulkEdit());
        };
        const quoteEditor = h_2('p.nfe-quote-text', [
            h_2('textarea.nfe-editor-quote', {
                props: {
                    placeholder: 'Quote',
                    value: text,
                    autoFocus: true,
                },
                on: {
                    change: onChangeText,
                },
            }),
        ]);
        const quoteEditorBulk = h_2('p.nfe-quote-text', [
            h_2('textarea.nfe-editor-quote-bulk', {
                props: {
                    placeholder: 'Bulk add quotes: a "~" should separate a quote\'s text and source, ' +
                        'and quotes should be separated by newlines. Quotation marks are ' +
                        'unnecessary. For example:\n\n' +
                        'All that we are is the result of what we have thought. ~ Buddha\n' +
                        'One of the secrets to staying young is to always do things you don’t know how to do, to keep learning. ~ Ruth Reichl\n' +
                        'The most common way people give up their power is by thinking they don’t have any. ~ Alice Walker',
                    value: text,
                    autoFocus: true,
                },
                on: {
                    change: onChangeText,
                },
            }),
        ]);
        const sourceEditor = h_2('p.nfe-quote-source', [
            h_2('span', '~ '),
            h_2('input.nfe-editor-source', {
                props: {
                    type: 'text',
                    placeholder: 'Source',
                    value: source,
                },
                on: {
                    change: onChangeSource,
                },
            }),
        ]);
        const buttons = h_2('div', [
            h_2('button.nfe-button', { on: { click: onCancel } }, 'Cancel'),
            h_2('button.nfe-button.nfe-button-primary', { on: { click: onSave } }, 'Save'),
            h_2('label.nfe-label.nfe-label-add-bulk', [
                h_2('input.nfe-checkbox', {
                    props: {
                        type: 'checkbox',
                        checked: isEditingBulk,
                    },
                    on: {
                        change: onCheckboxToggle,
                    },
                }),
                'Bulk add',
            ]),
        ]);
        const error = h_2('div.nfe-error', errorMessage);
        if (isEditingBulk) {
            if (errorMessage) {
                return h_2('div', [quoteEditorBulk, buttons, error]);
            }
            return h_2('div', [quoteEditorBulk, buttons]);
        }
        return h_2('div', [quoteEditor, sourceEditor, buttons]);
    };

    const MenuItem = (store, action, children) => {
        const onClick = e => {
            e.preventDefault();
            store.dispatch(menuHide());
            store.dispatch(action);
        };
        return h_2('li', [
            h_2('a.nfe-quote-action-menu-item', { props: { href: '#' }, on: { click: onClick } }, children),
        ]);
    };
    const QuoteMenu = (store) => {
        return h_2('div.nfe-quote-action-menu-content', [
            h_2('ul', [
                MenuItem(store, removeCurrentQuote(), 'Remove this quote'),
                MenuItem(store, selectNewQuote(), 'See another quote'),
                MenuItem(store, startEditing(), 'Enter custom quote...'),
            ]),
        ]);
    };
    const QuoteDisplay = (store) => {
        const state = store.getState();
        const quote = currentQuote(state);
        if (quote == null)
            return null;
        if (state.isEditingQuote) {
            return h_2('div.nfe-quote', [QuoteEditor(store)]);
        }

        // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@


        var kanji = quote.text.split(".");

        const toggleMenu = () => store.dispatch(menuToggle());
        return h_2('div.nfe-quote', [
            h_2('nfe-quote-action-menu', [
                h_2('a.nfe-quote-action-menu-button', { props: { href: '#' }, on: { click: toggleMenu } }, '▾'),
                state.isQuoteMenuVisible ? QuoteMenu(store) : null,
            ]),
            h_2('div', [
                h_2('p.nfe-quote-text', [
                    h_2('span', '“'),
					h_2('span', " " + quote.id + "/" +BuiltinQuotes.length),


					h_2('h1.kanji', kanji[0]),

					h_2('div.small',[
						h_2('span', kanji[1]),
						h_2('br', ""),
						h_2('span', kanji[2]),
						h_2('br', ""),
	
						h_2('span', kanji[3]),
						h_2('br', ""),
	
						h_2('span', kanji[4]),
						h_2('br', ""),
	
						h_2('span', kanji[5]),
						h_2('br', ""),
	
						h_2('span', kanji[6]),
						h_2('br', ""),
	
						h_2('span', kanji[7]),
						h_2('br', ""),
	
						h_2('span', kanji[8]),
						h_2('br', ""),
						h_2('span', kanji[9])
					]),

					h_2('span', '”'),
					h_2('br', ""),
					h_2('span', [h_2('span', '~ '), h_2('span', quote.source)]),
                ]),
                // h_2('p.nfe-quote-source', [h_2('span', '~ '), h_2('span', quote.source)]),
            ]),
        ]);
    };

    const CheckboxField = (store, checked, text, toggleAction, disabled = false) => {
        return h_2('label', [
            h_2('input', {
                props: {
                    type: 'checkbox',
                    checked,
                    disabled,
                },
                on: {
                    change: () => store.dispatch(toggleAction),
                },
            }),
            h_2('span', text),
        ]);
    };
    const Settings = (store) => {
        let state = store.getState();
        const fieldShowQuotes = CheckboxField(store, state.showQuotes, 'Show Quotes', toggleShowQuotes());
        const fieldShowBuiltin = CheckboxField(store, state.builtinQuotesEnabled, 'Enable Built-in Quotes', toggleBuiltinQuotes(), !state.showQuotes);
        const hiddenQuoteCount = state.hiddenBuiltinQuotes.length;
        const hiddenQuoteReset = e => {
            e.preventDefault();
            store.dispatch(resetHiddenQuotes());
        };
        const hiddenQuotes = h_2('span.nfe-settings-hidden-quote-count', [
            h_2('span', ' ' + hiddenQuoteCount + ' hidden - '),
            h_2('a', { props: { href: '#' }, on: { click: hiddenQuoteReset } }, 'Reset'),
        ]);
        const customQuotes = () => {
            if (state.customQuotes.length > 0) {
                return h_2('label', state.customQuotes.length + ' custom quotes');
            }
            return h_2('label', 'You can now add your own custom quotes! ' +
                'Just click the arrow menu beside the quote text.');
        };
        return h_2('form.nfe-settings', [
            h_2('fieldset', [
                h_2('legend', [fieldShowQuotes]),
                fieldShowBuiltin,
                hiddenQuoteCount > 0 ? hiddenQuotes : null,
                h_2('p', [customQuotes()]),
            ]),
        ]);
    };

    const Heading = (store) => {
        const closeInfoPanel = () => {
            store.dispatch(hideInfoPanel());
        };
        return [
            h_2('h1', 'News Feed Eradicator'),
            h_2('a.nfe-close-button', {
                props: { title: 'Close information panel' },
                on: { click: closeInfoPanel },
            }, 'X'),
        ];
    };
    const Icon = (svgPath) => (color) => h_2('svg', {
        attrs: {
            x: '0px',
            y: '0px',
            width: '32px',
            height: '32px',
            viewBox: '0 0 32 32',
            'enable-background': 'new 0 0 32 32',
        },
    }, [h_2('path', { attrs: { fill: color, d: svgPath } })]);
    const FacebookIcon = Icon('M30.7,0H1.3C0.6,0,0,0.6,0,1.3v29.3C0,31.4,0.6,32,1.3,32H17V20h-4v-5h4v-4 c0-4.1,2.6-6.2,6.3-6.2C25.1,4.8,26.6,5,27,5v4.3l-2.6,0c-2,0-2.5,1-2.5,2.4V15h5l-1,5h-4l0.1,12h8.6c0.7,0,1.3-0.6,1.3-1.3V1.3 C32,0.6,31.4,0,30.7,0z');
    const TwitterIcon = Icon('M32,6.1c-1.2,0.5-2.4,0.9-3.8,1c1.4-0.8,2.4-2.1,2.9-3.6c-1.3,0.8-2.7,1.3-4.2,1.6C25.7,3.8,24,3,22.2,3 c-3.6,0-6.6,2.9-6.6,6.6c0,0.5,0.1,1,0.2,1.5C10.3,10.8,5.5,8.2,2.2,4.2c-0.6,1-0.9,2.1-0.9,3.3c0,2.3,1.2,4.3,2.9,5.5 c-1.1,0-2.1-0.3-3-0.8c0,0,0,0.1,0,0.1c0,3.2,2.3,5.8,5.3,6.4c-0.6,0.1-1.1,0.2-1.7,0.2c-0.4,0-0.8,0-1.2-0.1 c0.8,2.6,3.3,4.5,6.1,4.6c-2.2,1.8-5.1,2.8-8.2,2.8c-0.5,0-1.1,0-1.6-0.1C2.9,27.9,6.4,29,10.1,29c12.1,0,18.7-10,18.7-18.7 c0-0.3,0-0.6,0-0.8C30,8.5,31.1,7.4,32,6.1z');
    const Share = () => {
        return [
            h_2('h2', 'Share'),
            h_2('div.nfe-social-media-icons', [
                h_2('a.nfe-social-media-icon', { props: { href: 'https://www.facebook.com/NewsFeedEradicator/' } }, [FacebookIcon('#4f92ff')]),
                h_2('a.nfe-social-media-icon', { props: { href: 'https://twitter.com/NewsFeedErad' } }, [TwitterIcon('#4f92ff')]),
            ]),
        ];
    };
    const Contribute = () => {
        return [
            h_2('h2', 'Contribute'),
            h_2('p', [
                h_2('span', 'News Feed Eradicator is open source. '),
                h_2('a', {
                    props: { href: 'https://github.com/jordwest/news-feed-eradicator/' },
                }, 'Fork on GitHub'),
            ]),
        ];
    };
    const Remove = () => {
        return [
            h_2('h2', 'Remove'),
            h_2('ul', [
                h_2('li', [
                    h_2('a', {
                        props: {
                            href: 'https://west.io/news-feed-eradicator/remove.html',
                        },
                    }, 'Removal Instructions'),
                ]),
            ]),
        ];
    };
    const InfoPanel = (store) => {
        return h_2('div.nfe-info-panel', [
            h_2('div.nfe-info-col', [].concat(Heading(store), h_2('hr'), h_2('h2', 'Settings'), Settings(store), h_2('hr'), Share(), h_2('hr'), Contribute(), h_2('hr'), Remove())),
        ]);
    };

    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

    const NewsFeedEradicator = (store) => {
        const state = store.getState();
        // TODO: Add quotes component
        const quoteDisplay = state.showQuotes ? QuoteDisplay(store) : null;
        const newFeatureLabel = null;
        const infoPanel = state.showInfoPanel ? InfoPanel(store) : null;
        const selectNew = () => store.dispatch(selectNewQuote());
        const link = h_2('a.nfe-info-link', { on: { click: selectNew } }, [
            h_2('span', 'Swap'),
            newFeatureLabel,
        ]);
        // Entire app component
        return h_2('div', [infoPanel, quoteDisplay, link]);
    };

    const NewsFeedEradicatorNext = (store) => {
		const state = store.getState();
		// TODO: Add quotes component
		const quoteDisplay = state.showQuotes ? QuoteDisplay(store) : null;
		const newFeatureLabel = null;
		const infoPanel = state.showInfoPanel ? InfoPanel(store) : null;
		const selectNew = () => store.dispatch(selectNewQuoteNext());
		const link = h_2('a.nfe-info-link-next', { on: { click: selectNew } }, [
			h_2('span', 'Next'),
			newFeatureLabel,
		]);
		// Entire app component
		return h_2('div', link);
    };

    const NewsFeedEradicatorPre = (store) => {
		const state = store.getState();
		// TODO: Add quotes component
		const quoteDisplay = state.showQuotes ? QuoteDisplay(store) : null;
		const newFeatureLabel = null;
		const infoPanel = state.showInfoPanel ? InfoPanel(store) : null;
		const selectNew = () => store.dispatch(selectNewQuotePre());
		const link = h_2('a.nfe-info-link-pre', { on: { click: selectNew } }, [
			h_2('span', 'Pre'),
			newFeatureLabel,
		]);
		// Entire app component
		return h_2('div', link);
	};
    
    var next = Math.floor(Math.random() * BuiltinQuotes.length);
	function selectNewQuoteNext() {
		return (dispatch, getState) => {
			const state = getState();
			const builtinQuotes = getBuiltinQuotes(state);
			const customQuotes = state.customQuotes;
			const allQuotes = builtinQuotes.concat(customQuotes);
			if (allQuotes.length < 1) {
				return dispatch({
					type: ActionTypes$1.SELECT_NEW_QUOTE,
					isCustom: false,
					id: null,
				});
			}
			next++;
			if (next === allQuotes.length) {
				next = 0;
			}
			dispatch({
				type: ActionTypes$1.SELECT_NEW_QUOTE,
				isCustom: next >= builtinQuotes.length,
				id: allQuotes[next].id,
			});

		};
	}
	function selectNewQuotePre() {
		return (dispatch, getState) => {
			const state = getState();
			const builtinQuotes = getBuiltinQuotes(state);
			const customQuotes = state.customQuotes;
			const allQuotes = builtinQuotes.concat(customQuotes);
			if (allQuotes.length < 1) {
				return dispatch({
					type: ActionTypes$1.SELECT_NEW_QUOTE,
					isCustom: false,
					id: null,
				});
			}
			next--;
			if (next === 0) {
				next = allQuotes.length-1;
			}
			dispatch({
				type: ActionTypes$1.SELECT_NEW_QUOTE,
				isCustom: next >= builtinQuotes.length,
				id: allQuotes[next].id,
			});

		};
	}

    function vnode(sel, data, children, text, elm) {
        var key = data === undefined ? undefined : data.key;
        return { sel: sel, data: data, children: children,
            text: text, elm: elm, key: key };
    }

    var array = Array.isArray;
    function primitive(s) {
        return typeof s === 'string' || typeof s === 'number';
    }

    function createElement(tagName) {
        return document.createElement(tagName);
    }
    function createElementNS(namespaceURI, qualifiedName) {
        return document.createElementNS(namespaceURI, qualifiedName);
    }
    function createTextNode(text) {
        return document.createTextNode(text);
    }
    function createComment(text) {
        return document.createComment(text);
    }
    function insertBefore(parentNode, newNode, referenceNode) {
        parentNode.insertBefore(newNode, referenceNode);
    }
    function removeChild(node, child) {
        node.removeChild(child);
    }
    function appendChild(node, child) {
        node.appendChild(child);
    }
    function parentNode(node) {
        return node.parentNode;
    }
    function nextSibling(node) {
        return node.nextSibling;
    }
    function tagName(elm) {
        return elm.tagName;
    }
    function setTextContent(node, text) {
        node.textContent = text;
    }
    function getTextContent(node) {
        return node.textContent;
    }
    function isElement(node) {
        return node.nodeType === 1;
    }
    function isText(node) {
        return node.nodeType === 3;
    }
    function isComment(node) {
        return node.nodeType === 8;
    }
    var htmlDomApi = {
        createElement: createElement,
        createElementNS: createElementNS,
        createTextNode: createTextNode,
        createComment: createComment,
        insertBefore: insertBefore,
        removeChild: removeChild,
        appendChild: appendChild,
        parentNode: parentNode,
        nextSibling: nextSibling,
        tagName: tagName,
        setTextContent: setTextContent,
        getTextContent: getTextContent,
        isElement: isElement,
        isText: isText,
        isComment: isComment,
    };

    function isUndef(s) { return s === undefined; }
    function isDef(s) { return s !== undefined; }
    var emptyNode = vnode('', {}, [], undefined, undefined);
    function sameVnode(vnode1, vnode2) {
        return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
    }
    function isVnode(vnode) {
        return vnode.sel !== undefined;
    }
    function createKeyToOldIdx(children, beginIdx, endIdx) {
        var i, map = {}, key, ch;
        for (i = beginIdx; i <= endIdx; ++i) {
            ch = children[i];
            if (ch != null) {
                key = ch.key;
                if (key !== undefined)
                    map[key] = i;
            }
        }
        return map;
    }
    var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
    function init(modules, domApi) {
        var i, j, cbs = {};
        var api = domApi !== undefined ? domApi : htmlDomApi;
        for (i = 0; i < hooks.length; ++i) {
            cbs[hooks[i]] = [];
            for (j = 0; j < modules.length; ++j) {
                var hook = modules[j][hooks[i]];
                if (hook !== undefined) {
                    cbs[hooks[i]].push(hook);
                }
            }
        }
        function emptyNodeAt(elm) {
            var id = elm.id ? '#' + elm.id : '';
            var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
            return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
        }
        function createRmCb(childElm, listeners) {
            return function rmCb() {
                if (--listeners === 0) {
                    var parent_1 = api.parentNode(childElm);
                    api.removeChild(parent_1, childElm);
                }
            };
        }
        function createElm(vnode, insertedVnodeQueue) {
            var i, data = vnode.data;
            if (data !== undefined) {
                if (isDef(i = data.hook) && isDef(i = i.init)) {
                    i(vnode);
                    data = vnode.data;
                }
            }
            var children = vnode.children, sel = vnode.sel;
            if (sel === '!') {
                if (isUndef(vnode.text)) {
                    vnode.text = '';
                }
                vnode.elm = api.createComment(vnode.text);
            }
            else if (sel !== undefined) {
                // Parse selector
                var hashIdx = sel.indexOf('#');
                var dotIdx = sel.indexOf('.', hashIdx);
                var hash = hashIdx > 0 ? hashIdx : sel.length;
                var dot = dotIdx > 0 ? dotIdx : sel.length;
                var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
                var elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                    : api.createElement(tag);
                if (hash < dot)
                    elm.setAttribute('id', sel.slice(hash + 1, dot));
                if (dotIdx > 0)
                    elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));
                for (i = 0; i < cbs.create.length; ++i)
                    cbs.create[i](emptyNode, vnode);
                if (array(children)) {
                    for (i = 0; i < children.length; ++i) {
                        var ch = children[i];
                        if (ch != null) {
                            api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                        }
                    }
                }
                else if (primitive(vnode.text)) {
                    api.appendChild(elm, api.createTextNode(vnode.text));
                }
                i = vnode.data.hook; // Reuse variable
                if (isDef(i)) {
                    if (i.create)
                        i.create(emptyNode, vnode);
                    if (i.insert)
                        insertedVnodeQueue.push(vnode);
                }
            }
            else {
                vnode.elm = api.createTextNode(vnode.text);
            }
            return vnode.elm;
        }
        function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
            for (; startIdx <= endIdx; ++startIdx) {
                var ch = vnodes[startIdx];
                if (ch != null) {
                    api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
                }
            }
        }
        function invokeDestroyHook(vnode) {
            var i, j, data = vnode.data;
            if (data !== undefined) {
                if (isDef(i = data.hook) && isDef(i = i.destroy))
                    i(vnode);
                for (i = 0; i < cbs.destroy.length; ++i)
                    cbs.destroy[i](vnode);
                if (vnode.children !== undefined) {
                    for (j = 0; j < vnode.children.length; ++j) {
                        i = vnode.children[j];
                        if (i != null && typeof i !== "string") {
                            invokeDestroyHook(i);
                        }
                    }
                }
            }
        }
        function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
            for (; startIdx <= endIdx; ++startIdx) {
                var i_1 = void 0, listeners = void 0, rm = void 0, ch = vnodes[startIdx];
                if (ch != null) {
                    if (isDef(ch.sel)) {
                        invokeDestroyHook(ch);
                        listeners = cbs.remove.length + 1;
                        rm = createRmCb(ch.elm, listeners);
                        for (i_1 = 0; i_1 < cbs.remove.length; ++i_1)
                            cbs.remove[i_1](ch, rm);
                        if (isDef(i_1 = ch.data) && isDef(i_1 = i_1.hook) && isDef(i_1 = i_1.remove)) {
                            i_1(ch, rm);
                        }
                        else {
                            rm();
                        }
                    }
                    else {
                        api.removeChild(parentElm, ch.elm);
                    }
                }
            }
        }
        function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
            var oldStartIdx = 0, newStartIdx = 0;
            var oldEndIdx = oldCh.length - 1;
            var oldStartVnode = oldCh[0];
            var oldEndVnode = oldCh[oldEndIdx];
            var newEndIdx = newCh.length - 1;
            var newStartVnode = newCh[0];
            var newEndVnode = newCh[newEndIdx];
            var oldKeyToIdx;
            var idxInOld;
            var elmToMove;
            var before;
            while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
                if (oldStartVnode == null) {
                    oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
                }
                else if (oldEndVnode == null) {
                    oldEndVnode = oldCh[--oldEndIdx];
                }
                else if (newStartVnode == null) {
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (newEndVnode == null) {
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newStartVnode)) {
                    patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                    oldStartVnode = oldCh[++oldStartIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (sameVnode(oldEndVnode, newEndVnode)) {
                    patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newEndVnode)) {
                    patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                    oldStartVnode = oldCh[++oldStartIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldEndVnode, newStartVnode)) {
                    patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    if (oldKeyToIdx === undefined) {
                        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                    }
                    idxInOld = oldKeyToIdx[newStartVnode.key];
                    if (isUndef(idxInOld)) {
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                        newStartVnode = newCh[++newStartIdx];
                    }
                    else {
                        elmToMove = oldCh[idxInOld];
                        if (elmToMove.sel !== newStartVnode.sel) {
                            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                        }
                        else {
                            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                            oldCh[idxInOld] = undefined;
                            api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                        }
                        newStartVnode = newCh[++newStartIdx];
                    }
                }
            }
            if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
                if (oldStartIdx > oldEndIdx) {
                    before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                    addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
                }
                else {
                    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
                }
            }
        }
        function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
            var i, hook;
            if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
                i(oldVnode, vnode);
            }
            var elm = vnode.elm = oldVnode.elm;
            var oldCh = oldVnode.children;
            var ch = vnode.children;
            if (oldVnode === vnode)
                return;
            if (vnode.data !== undefined) {
                for (i = 0; i < cbs.update.length; ++i)
                    cbs.update[i](oldVnode, vnode);
                i = vnode.data.hook;
                if (isDef(i) && isDef(i = i.update))
                    i(oldVnode, vnode);
            }
            if (isUndef(vnode.text)) {
                if (isDef(oldCh) && isDef(ch)) {
                    if (oldCh !== ch)
                        updateChildren(elm, oldCh, ch, insertedVnodeQueue);
                }
                else if (isDef(ch)) {
                    if (isDef(oldVnode.text))
                        api.setTextContent(elm, '');
                    addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
                }
                else if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                else if (isDef(oldVnode.text)) {
                    api.setTextContent(elm, '');
                }
            }
            else if (oldVnode.text !== vnode.text) {
                api.setTextContent(elm, vnode.text);
            }
            if (isDef(hook) && isDef(i = hook.postpatch)) {
                i(oldVnode, vnode);
            }
        }
        return function patch(oldVnode, vnode) {
            var i, elm, parent;
            var insertedVnodeQueue = [];
            for (i = 0; i < cbs.pre.length; ++i)
                cbs.pre[i]();
            if (!isVnode(oldVnode)) {
                oldVnode = emptyNodeAt(oldVnode);
            }
            if (sameVnode(oldVnode, vnode)) {
                patchVnode(oldVnode, vnode, insertedVnodeQueue);
            }
            else {
                elm = oldVnode.elm;
                parent = api.parentNode(elm);
                createElm(vnode, insertedVnodeQueue);
                if (parent !== null) {
                    api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                    removeVnodes(parent, [oldVnode], 0, 0);
                }
            }
            for (i = 0; i < insertedVnodeQueue.length; ++i) {
                insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
            }
            for (i = 0; i < cbs.post.length; ++i)
                cbs.post[i]();
            return vnode;
        };
    }

    var props = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function updateProps(oldVnode, vnode) {
        var key, cur, old, elm = vnode.elm, oldProps = oldVnode.data.props, props = vnode.data.props;
        if (!oldProps && !props)
            return;
        if (oldProps === props)
            return;
        oldProps = oldProps || {};
        props = props || {};
        for (key in oldProps) {
            if (!props[key]) {
                delete elm[key];
            }
        }
        for (key in props) {
            cur = props[key];
            old = oldProps[key];
            if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
                elm[key] = cur;
            }
        }
    }
    exports.propsModule = { create: updateProps, update: updateProps };
    exports.default = exports.propsModule;

    });

    var propsModule = unwrapExports(props);
    var props_1 = props.propsModule;

    var attributes = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var xlinkNS = 'http://www.w3.org/1999/xlink';
    var xmlNS = 'http://www.w3.org/XML/1998/namespace';
    var colonChar = 58;
    var xChar = 120;
    function updateAttrs(oldVnode, vnode) {
        var key, elm = vnode.elm, oldAttrs = oldVnode.data.attrs, attrs = vnode.data.attrs;
        if (!oldAttrs && !attrs)
            return;
        if (oldAttrs === attrs)
            return;
        oldAttrs = oldAttrs || {};
        attrs = attrs || {};
        // update modified attributes, add new attributes
        for (key in attrs) {
            var cur = attrs[key];
            var old = oldAttrs[key];
            if (old !== cur) {
                if (cur === true) {
                    elm.setAttribute(key, "");
                }
                else if (cur === false) {
                    elm.removeAttribute(key);
                }
                else {
                    if (key.charCodeAt(0) !== xChar) {
                        elm.setAttribute(key, cur);
                    }
                    else if (key.charCodeAt(3) === colonChar) {
                        // Assume xml namespace
                        elm.setAttributeNS(xmlNS, key, cur);
                    }
                    else if (key.charCodeAt(5) === colonChar) {
                        // Assume xlink namespace
                        elm.setAttributeNS(xlinkNS, key, cur);
                    }
                    else {
                        elm.setAttribute(key, cur);
                    }
                }
            }
        }
        // remove removed attributes
        // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
        // the other option is to remove all attributes with value == undefined
        for (key in oldAttrs) {
            if (!(key in attrs)) {
                elm.removeAttribute(key);
            }
        }
    }
    exports.attributesModule = { create: updateAttrs, update: updateAttrs };
    exports.default = exports.attributesModule;

    });

    var attrsModule = unwrapExports(attributes);
    var attributes_1 = attributes.attributesModule;

    var eventlisteners = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function invokeHandler(handler, vnode, event) {
        if (typeof handler === "function") {
            // call function handler
            handler.call(vnode, event, vnode);
        }
        else if (typeof handler === "object") {
            // call handler with arguments
            if (typeof handler[0] === "function") {
                // special case for single argument for performance
                if (handler.length === 2) {
                    handler[0].call(vnode, handler[1], event, vnode);
                }
                else {
                    var args = handler.slice(1);
                    args.push(event);
                    args.push(vnode);
                    handler[0].apply(vnode, args);
                }
            }
            else {
                // call multiple handlers
                for (var i = 0; i < handler.length; i++) {
                    invokeHandler(handler[i]);
                }
            }
        }
    }
    function handleEvent(event, vnode) {
        var name = event.type, on = vnode.data.on;
        // call event handler(s) if exists
        if (on && on[name]) {
            invokeHandler(on[name], vnode, event);
        }
    }
    function createListener() {
        return function handler(event) {
            handleEvent(event, handler.vnode);
        };
    }
    function updateEventListeners(oldVnode, vnode) {
        var oldOn = oldVnode.data.on, oldListener = oldVnode.listener, oldElm = oldVnode.elm, on = vnode && vnode.data.on, elm = (vnode && vnode.elm), name;
        // optimization for reused immutable handlers
        if (oldOn === on) {
            return;
        }
        // remove existing listeners which no longer used
        if (oldOn && oldListener) {
            // if element changed or deleted we remove all existing listeners unconditionally
            if (!on) {
                for (name in oldOn) {
                    // remove listener if element was changed or existing listeners removed
                    oldElm.removeEventListener(name, oldListener, false);
                }
            }
            else {
                for (name in oldOn) {
                    // remove listener if existing listener removed
                    if (!on[name]) {
                        oldElm.removeEventListener(name, oldListener, false);
                    }
                }
            }
        }
        // add new listeners which has not already attached
        if (on) {
            // reuse existing listener or create new
            var listener = vnode.listener = oldVnode.listener || createListener();
            // update vnode for listener
            listener.vnode = vnode;
            // if element changed or added we add all needed listeners unconditionally
            if (!oldOn) {
                for (name in on) {
                    // add listener if element was changed or new listeners added
                    elm.addEventListener(name, listener, false);
                }
            }
            else {
                for (name in on) {
                    // add listener if new listener added
                    if (!oldOn[name]) {
                        elm.addEventListener(name, listener, false);
                    }
                }
            }
        }
    }
    exports.eventListenersModule = {
        create: updateEventListeners,
        update: updateEventListeners,
        destroy: updateEventListeners
    };
    exports.default = exports.eventListenersModule;

    });

    var eventsModule = unwrapExports(eventlisteners);
    var eventlisteners_1 = eventlisteners.eventListenersModule;

    var htmldomapi = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function createElement(tagName) {
        return document.createElement(tagName);
    }
    function createElementNS(namespaceURI, qualifiedName) {
        return document.createElementNS(namespaceURI, qualifiedName);
    }
    function createTextNode(text) {
        return document.createTextNode(text);
    }
    function createComment(text) {
        return document.createComment(text);
    }
    function insertBefore(parentNode, newNode, referenceNode) {
        parentNode.insertBefore(newNode, referenceNode);
    }
    function removeChild(node, child) {
        node.removeChild(child);
    }
    function appendChild(node, child) {
        node.appendChild(child);
    }
    function parentNode(node) {
        return node.parentNode;
    }
    function nextSibling(node) {
        return node.nextSibling;
    }
    function tagName(elm) {
        return elm.tagName;
    }
    function setTextContent(node, text) {
        node.textContent = text;
    }
    function getTextContent(node) {
        return node.textContent;
    }
    function isElement(node) {
        return node.nodeType === 1;
    }
    function isText(node) {
        return node.nodeType === 3;
    }
    function isComment(node) {
        return node.nodeType === 8;
    }
    exports.htmlDomApi = {
        createElement: createElement,
        createElementNS: createElementNS,
        createTextNode: createTextNode,
        createComment: createComment,
        insertBefore: insertBefore,
        removeChild: removeChild,
        appendChild: appendChild,
        parentNode: parentNode,
        nextSibling: nextSibling,
        tagName: tagName,
        setTextContent: setTextContent,
        getTextContent: getTextContent,
        isElement: isElement,
        isText: isText,
        isComment: isComment,
    };
    exports.default = exports.htmlDomApi;

    });

    unwrapExports(htmldomapi);
    var htmldomapi_1 = htmldomapi.htmlDomApi;

    var tovnode = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });


    function toVNode(node, domApi) {
        var api = domApi !== undefined ? domApi : htmldomapi.default;
        var text;
        if (api.isElement(node)) {
            var id = node.id ? '#' + node.id : '';
            var cn = node.getAttribute('class');
            var c = cn ? '.' + cn.split(' ').join('.') : '';
            var sel = api.tagName(node).toLowerCase() + id + c;
            var attrs = {};
            var children = [];
            var name_1;
            var i = void 0, n = void 0;
            var elmAttrs = node.attributes;
            var elmChildren = node.childNodes;
            for (i = 0, n = elmAttrs.length; i < n; i++) {
                name_1 = elmAttrs[i].nodeName;
                if (name_1 !== 'id' && name_1 !== 'class') {
                    attrs[name_1] = elmAttrs[i].nodeValue;
                }
            }
            for (i = 0, n = elmChildren.length; i < n; i++) {
                children.push(toVNode(elmChildren[i], domApi));
            }
            return vnode_1.default(sel, { attrs: attrs }, children, undefined, node);
        }
        else if (api.isText(node)) {
            text = api.getTextContent(node);
            return vnode_1.default(undefined, undefined, undefined, text, node);
        }
        else if (api.isComment(node)) {
            text = api.getTextContent(node);
            return vnode_1.default('!', {}, [], text, node);
        }
        else {
            return vnode_1.default('', {}, [], undefined, node);
        }
    }
    exports.toVNode = toVNode;
    exports.default = toVNode;

    });

    unwrapExports(tovnode);
    var tovnode_1 = tovnode.toVNode;

    const storePromise = createStore$1();
    function isAlreadyInjected() {
        return document.querySelector('#nfe-container') != null;
    }
    function injectUI(streamContainer) {
        var nfeContainer = document.createElement('div');
        nfeContainer.id = 'nfe-container';
        streamContainer.appendChild(nfeContainer);
        const patch = init([propsModule, attrsModule, eventsModule]);
        let vnode = tovnode_1(nfeContainer);
        storePromise
            .then(store => {
            const render = () => {
                const newVnode = h_2('div#nfe-container', [NewsFeedEradicator(store)]);
                patch(vnode, newVnode);
                vnode = newVnode;
            };
            render();
            store.subscribe(render);
        })
            .catch(handleError);
    }

    function injectUINext(streamContainer) {
		var nfeContainer = document.createElement('div');
		nfeContainer.id = 'nfe-container';
		streamContainer.appendChild(nfeContainer);
		const patch = init([propsModule, attrsModule, eventsModule]);
		

		let vnode = tovnode_1(nfeContainer);
		storePromise
			.then(store => {
				const render = () => {
					const newVnode = h_2('div#nfe-container', [NewsFeedEradicatorNext(store)]);
					patch(vnode, newVnode);
					vnode = newVnode;
				};
				render();
				store.subscribe(render);
			})
			.catch(handleError);
    }
    
    function injectUIPre(streamContainer) {
		var nfeContainer = document.createElement('div');
		nfeContainer.id = 'nfe-container';
		streamContainer.appendChild(nfeContainer);
		const patch = init([propsModule, attrsModule, eventsModule]);
		

		let vnode = tovnode_1(nfeContainer);
		storePromise
			.then(store => {
				const render = () => {
					const newVnode = h_2('div#nfe-container', [NewsFeedEradicatorPre(store)]);
					patch(vnode, newVnode);
					vnode = newVnode;
				};
				render();
				store.subscribe(render);
			})
			.catch(handleError);
	}

    const paths = ['', '/'];
    function isEnabled() {
        return paths.indexOf(window.location.pathname) > -1;
    }

    // Elements here are removed from the DOM.
    // These selectors should also be added to `eradicate.css`
    // to ensure they're hidden before the script loads.
    const elementsToRemove = [
        '.ticker_stream',
        '.ego_column',
        '#pagelet_gaming_destination_rhc',
        '#stories_pagelet_rhc',
        '#fb_stories_card_root',
        '#stories_pagelet_below_composer',
        '#pagelet_trending_tags_and_topics',
        '#pagelet_canvas_nav_content',
    ];
    const elementsToEmpty = ['[id^=topnews_main_stream]'];
    function checkSite() {
        return !!document.querySelector('#stream_pagelet');
    }
    function eradicate() {
        function eradicateRetry() {
            if (!isEnabled()) {
                return;
            }
            // Don't do anything if the FB UI hasn't loaded yet
            var streamContainer = document.querySelector('#stream_pagelet');
            if (streamContainer == null) {
                return;
            }
            remove({ toRemove: elementsToRemove, toEmpty: elementsToEmpty });
            // Add News Feed Eradicator quote/info panel
            if (!isAlreadyInjected()) {
                injectUI(streamContainer);
            }
        }
        // This delay ensures that the elements have been created by Facebook's
        // scripts before we attempt to replace them
        setInterval(eradicateRetry, 1000);
    }

    //export function checkSite(): boolean {
    //	return !!document.querySelector('#stream_pagelet');
    //}
    function eradicate$1() {
        function eradicateRetry() {
            if (!isEnabled()) {
                return;
            }
            // Don't do anything if the FB UI hasn't loaded yet
            const feed = document.querySelector('[role=feed]');
            const stories = document.querySelector('[aria-label=Stories]');
            if (feed == null) {
                return;
            }
            const container = feed.parentNode;
            // For some reason, removing these nodes are causing CPU usage to
            // sit at 100% while the page is open. Same thing if they're set to
            // display: none in CSS. I suspect it's to do with infinite scroll
            // again, so I'm going to leave the nodes in the tree for now, CSS
            // takes care of hiding them. It just means there's a scrollbar that
            // scrolls into emptiness, but it's better than constantly chewing CPU
            // for now.
            //
            //removeNode(feed);
            //removeNode(stories);
            // Add News Feed Eradicator quote/info panel
            if (!isAlreadyInjected()) {
                injectUI(container);
                injectUINext(container);
                injectUIPre(container);
            }
        }
        // This delay ensures that the elements have been created by Facebook's
        // scripts before we attempt to replace them
        setInterval(eradicateRetry, 1000);
    }

    // Include the stylesheets
    // Determine which variant we're working with
    if (checkSite()) {
        eradicate();
    }
    else {
        eradicate$1();
    }

}());
