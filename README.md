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
