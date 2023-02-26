import React, { useState, useEffect } from "react"

const appContext = React.createContext(null)
let state
let reducer // 避免放store里被人修改
let listeners = []
const setState = (newState) => {
  state = newState
  listeners.map((fn) => fn(state))
}
const store = {
  getState() {
    return state
  },
  subscribe(fn) {
    listeners.push(fn)
    // 返回取消订阅函数
    return () => {
      const index = listeners.indexOf(fn)
      listeners.splice(index, 1)
    }
  },
  dispatch(action) {
    // dispatch访问不到setAppState，因为我们把setAppState放到context里了
    // 想要让dispatch可以访问setAppState，可以声明一个Wrapper，在wrapper里返回组件，组件内可以访问context,Wrapper内定义dispatch
    setState(reducer(state, action))
    // update({})
  },
  // repleceReducer(newReducer) {
  //   reducer = newReducer
  // },
}

// 改写dispatch使其支持异步action
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

export const createStore = (_reducer, initState) => {
  state = initState
  reducer = _reducer
  return store
}

export const Provider = ({ store, children }) => {
  return <appContext.Provider value={store}>{children}</appContext.Provider>
}
const changed = (oldState, newState) => {
  let changed = false
  for (let key in oldState) {
    if (oldState[key] !== newState[key]) {
      changed = true
    }
  }
  return changed
}

export const connect = (selector, dispatchSelector) => (Component) => {
  return (props) => {
    // const { } = useContext(appContext) // 这里也可以从store里取
    const [, update] = useState({}) // 目的是为了更新视图
    const data = selector ? selector(state) : { state }
    useEffect(
      () =>
        // 注意这里最好取消订阅 否则在selector变化时出现重复订阅
        // 以下函数的值就是一个取消订阅函数，其作为返回值，会在useEffect调用之前执行
        store.subscribe(() => {
          // 调用dispatch改的是store上的数据，所以store.xx得到的是最新的数据
          const newData = selector ? selector(state) : { state }
          if (changed(data, newData)) {
            update({})
          }
        }),
      [selector]
    )
    const dispatchers = dispatchSelector
      ? dispatchSelector(dispatch)
      : { dispatch }
    return <Component {...props} {...data} {...dispatchers}></Component>
  }
}
