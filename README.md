# 项目参考 https://www.bilibili.com/video/BV14Y411G7nB/?spm_id_from=333.788&vd_source=b831eb3e5888129473a908615b2c5022

# 使用说明

本项目是采用 [Vite](https://github.com/vitejs/vite#vite-) 搭建的，开发时的编译速度超快！

## 开发

运行 `yarn dev` 或者 `npm run dev` 即可开始开发

## 打包

运行 `yarn build` 或者 `npm run build` 即可打包文件

## context 的使用

```js
import { useContext } from "react"

const appContext = React.createContext(null)

// 使用方法
const App = () => {
  const [appState, setAppState] = useState({
    user: { name: "frank", age: 18 },
  })
  const contextValue = { appState, setAppState }
  return <appContext.Provider value={contextValue}><>nnn<></appContext.Provider>
}

// User是<appContext.Provider>内的子孙组件
const User = () => {
  const contextValue = useContext(appContext)
  return <div>User:{contextValue.appState.user.name}</div>
}

```

## reducer 规范 state 的创建流程

不能直接修改原始的 state 和直接调用原始的 setState
需要封装一个函数来做这件事情，规范 state 的创建流程

## dispatch 规范 setState 的流程

原因：每次 setAppState 传入的都是 reduce(appState, {type: xx, payload: xx}),重复的东西很多,只有{type: xx, payload: xx}不一样

```js
setAppState(
  reducer(appState, {
    type: "updateUser",
    payload: { name: e.target.value },
  })
)
setAppState(
  reducer(appState, {
    type: "updateUser",
    payload: { age: e.target.value },
  })
)
```

想要像如下方式调用

```js
dispatch({
  type: "updateUser",
  payload: { name: e.target.value },
})
```

dispatch 访问不到 setAppState 怎么办？把 dispatch 写在一个 wrapper 里, wrapper 内使用 context 并定义 dispatch

## connect 来自 react-redux

上一章节 dispatch 缺点：包裹了一个 Wrapper，使用 UserModifier 组件的时候要用到这个 Wrapper 而不是 UserModifier 本身，所以，任何想要使用 dispatch 方法的组件都需要创建一个 Wrapper,这显然不合理
所以我们需要写一个函数去自动创建 wrapper
connect 的作用就是将组件与全局状态连接起来，实现方式就是使用高阶组件：将组件传入一个函数，再返回包裹有 context 上下文数据（即全局状态）的高阶组件
connect 由 react-redux 提供

## store + setState({}) + 发布订阅模式实现精准渲染

以上会出现组件重复渲染问题，比如修改二儿子里的 input 数据，如下 5 个组件都执行了
大儿子执行了 0.6417016355557932
User 执行了 0.5618145576714255
二儿子执行了 0.2789547950889919
UserModifier 执行了 0.4553706330076448
幺儿子执行了 0.5341419853632572

useMemo 可以暂时解决这个问题，但不优雅

造成重复渲染是因为使用了 useState 里的 setState，这里我们不使用它，而是创建一个 store,通过 store 里的 setState 来修改数据，结合 setState({})来通知 react 来更新视图,这时候只有使用到 connect 的组件才会被 dispatch 触发更新，但其他使用到这个数据的组件并没有触发更新，于是我们可以使用发布订阅模式批量更新（只通知订阅者,订阅者就是使用 connect 连接了全局状态的组件）,在 connect 里调用 store.discribe()，传入的 fn 就是 update({})

## redux 乍现

将 context store connect reducer 提取到单独的 redux.jsx 文件
为什么是 jsx 不是 js?

## selector 来自 react-redux

痛点：{state.user.name}想要获取到 name，可能会需要非常多的层级，例如 state.x.y.z.name

```js
const User = connect(({ state }) => {
  console.log("User执行了" + Math.random())
  return <div>User:{state.user.name}</div>
})
```

解决方法是在 connect 调用前增加一层函数调用(高阶函数)，去返回当前的 state，然后传入到组件内

```js
connect((state) => {
  return { user: state.user }
})(({ user }) => {
  return <div>User:{user.name}</div>
})
```

## selector 实现精准渲染

**组件只在自己的数据变化时才 render**
痛点：store 内数据如下，幺儿子引入 group,user 变化时，幺儿子也更新了，那么如何确保这种情况下幺儿子不去更新呢？

```js
state: {
    user: { name: "frank", age: 18 },
    group: { name: "前端组" },
  },
```

解决办法是在订阅的时候判断数据是否变化，未变化则不更新

```js
const changed = (oldState, newState) => {}

export const connect = (selector) => (Component) => {
  return (props) => {
    ...
    useEffect(
      () =>
        // 注意这里最好取消订阅 否则在selector变化时出现重复订阅
        // 以下函数的值就是一个取消订阅函数，其作为返回值，会在useEffect调用之前执行
        store.subscribe(() => {
          // 调用dispatch改的是store上的数据，所以store.xx得到的是最新的数据
          const newData = selector
            ? selector(store.state)
            : { state: store.state }
          if (changed(data, newData)) {
            update({})
          }
        }),
      [selector]
    )
    ...
  }
}
```

## MapDispatchertoProps connect(selector, MapDispatchertoProps)(组件)

connect 的第二个参数，用来封装 dispatch

```js
const UserModifier = connect()(({ dispatch, state, children }) => {
  const onChange = (e) => {
    dispatch({
      type: "updateUser",
      payload: { name: e.target.value },
    })
  }
})
```

```js
const UserModifier = connect(null, (dispatch) => {
  return {
    updateUser: (attrs) => dispatch({ type: "updateUser", payload: attrs }),
  }
})(({ updateUser, state, children }) => {
  const onChange = (e) => {
    updateUser({
      name: e.target.value,
    })
  }
})
```

## connect 的意义：为什么是高阶组件而不是直接传递 MapSelectorToProps、MapDispatcherToProps、Component 这 3 个参数？

**为什么是 connect(MapSelectorToProps,MapDispatcherToProps)(Component)？**
**MapSelectorToProps**用来封装读（获取 state）,**MapDispatcherToProps**用来封装写（修改 store 里的 state，setState({})通知更新）
每个组件都可以调用 connect 连接全局状态
我们可以将 **MapSelectorToProps** 和 **MapDispatcherToProps** 抽取到单独的文件进行管理，
然后将 **connect(MapSelectorToProps,MapDispatcherToProps)**整体抽取出来单独管理

## 封装 createStore 和 provider

以上步骤最终得到的 store 里的数据是写死的，reducer 也是写死的
可以把 state 和 reducer 作为参数传入 createStore，得到 store
以下写法也可以完善

```js
<appContext.Provider value={store}>
  <大儿子 />
  <二儿子 />
  <幺儿子 />
</appContext.Provider>
```

可以把 appContext 从 redux 里去掉，取而代之将其封装在 Provider 里

```js
export const Provider = ({ store, children }) => {
  return <appContext.Provider value={store}>{children}</appContext.Provider>
}
```

## redux 各种概念总结

如图 redux 概念总结：**store state connect**
首先有一个 app，它里面有很多组件，需要让每一个组件可以访问到全局 state
全局 state 我们放在 store 里
组件和 store 如何连接呢？react-redux 提供了一个 api 叫 connect
连接组件后做什么呢？两件事情，一个用来读（从组件属性里取 state）,一个用来写（组件属性里取 dispatch）
如果想要读写更精确呢？可以传入两个参数，一个是 selector，可以取到 state 里某个精确的值；一个是 mapDispatchToProps，可以得到如 updateUser 之类的 api

**connect 怎么做的呢？**
首先对组件进行了一层封装，封装了一个高阶组件，主要做了 3 件事情

1. 从上下文或者 store 里拿到 state 和 setState
2. 根据 selector 和 dispatchSelector/mapDispatchToProps 得到具体的数据和 dispatcher
3. 对 store 进行订阅，一旦数据发生变化则调用 update 通知更新

## redux 组件重构

参考 redux 官方
将 getState 写入 store，
将 state、reducer、listener、setState 提取到外部
将 dispatch 写入 store

## redux 对异步 action 的支持：异步函数里调用 dispatch

直观写法如下

```js
const onClick = (e) => {
  ajax("/user").then((response) => {
    dispatch({ type: "updateUser", payload: response.data })
  })
}
```

提取函数后如下

```js
const fetchUser = (dispatch) => {
  ajax("/user").then((response) => {
    dispatch({ type: "updateUser", payload: response.data })
  })
}
const onClick = (e) => {
  fetchUser(dispatch)
}
```

fetchUser(dispatch)这种写法不符合常规写法，应为 dispatch(fetchUser),如何做到？

```js
let prevDispatch = dispatch
// 重写dispatch
dispatch = (fn) => {
  fn(prevDispatch)
}
dispatch(fetchUser)
```

由于 fetchUser 是一个函数，所以可以在 dispatch 上做文章，当传入的 action 为函数时，action(dispatch)
实现方式如下：

```js
let dispatch = store.dispatch
const prevDispatch = dispatch
dispatch = (action) => {
  if (typeof action === "function") {
    // 这里为什么是dispatch而不是prevDispatch？因为有可能用户在使用dispatch的时候这么用的：dispatch(dispatch(fn))
    action(dispatch)
  } else {
    prevDispatch(action)
  }
}
```

## redux 对异步 action 的支持：异步写在 payload 里

同样是重写 dispatch

```js
dispatch = (action) => {
  if (action.payload instanceof Promise) {
    action.payload.then((data) => {
      // 这里不使用prevDispatch2的原因是因为有可能data又是一个promise
      dispatch({ ...action, payload: data })
    })
  } else {
    prevDispatch2(action)
  }
}
```

## redux 中间件 middleware

中间件的使用方式，在 createStore 里传入第三个参数 applyMiddleware,
applyMiddleware 里的 middleware 倒序执行，
而 middleware 就是一个函数，是用来修改 dispatch 的

```js
const store = createStore(
  reducer,
  initState,
  applyMiddleware(reduxThunk, reduxPromise)
)
```

支持函数--对应中间件 redux-thunk（源码可以看一下，特别少，和上面写的类似）
支持 payload 为 promsie--对应中间件 redux-promise（源码和上面写的类似）

**面试官问：怎么通过中间件让 redux 支持异步？**
回答：
有两个著名的中间件
一个是 redux-thunk，它发现如果 action 时函数，就用这个函数去调用 dispatch,如果不是就进入下一个中间件
一个是 redux-promise，它发现如果 payload 是 promise，就在 payload 后添加 then,将 promise 的结果给到 payload 并覆盖原来的 payload

可以看看 applyMiddleware 如何倒序执行 middleware 的

作业：写一篇博客，讲讲各个 api 的使用 store、state、dispatch、connect、reducer、provider、中间件 分别干什么的
