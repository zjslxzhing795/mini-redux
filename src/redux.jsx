import React, { useState, useContext, useEffect } from "react"

export const appContext = React.createContext(null)

export const store = {
  state: {
    user: { name: "frank", age: 18 },
    group: { name: "前端组" },
  },
  setState(newState) {
    store.state = newState
    store.listeners.map((fn) => fn(store.state))
  },
  listeners: [],
  subscribe(fn) {
    store.listeners.push(fn)
    // 返回取消订阅函数
    return () => {
      const index = store.listeners.indexOf(fn)
      store.listeners.splice(index, 1)
    }
  },
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
    const { state, setState } = useContext(appContext)
    const [, update] = useState({}) // 目的是为了更新视图
    const data = selector ? selector(state) : { state }
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
    const dispatch = (action) => {
      // dispatch访问不到setAppState，因为我们把setAppState放到context里了
      // 想要让dispatch可以访问setAppState，可以声明一个Wrapper，在wrapper里返回组件，组件内可以访问context,Wrapper内定义dispatch
      setState(reducer(state, action))
      // update({})
    }
    const dispatchers = dispatchSelector
      ? dispatchSelector(dispatch)
      : { dispatch }
    return <Component {...props} {...data} {...dispatchers}></Component>
  }
}

const reducer = (state, { type, payload }) => {
  if (type === "updateUser") {
    return {
      ...state,
      user: {
        ...state.user,
        ...payload,
      },
    }
  } else {
    return state
  }
}
