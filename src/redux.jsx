import React, { useState, useContext, useEffect } from "react"

export const appContext = React.createContext(null)

export const store = {
  state: {
    user: { name: "frank", age: 18 },
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

export const connect = (Component) => {
  return (props) => {
    const { state, setState } = useContext(appContext)
    const [, update] = useState({}) // 目的是为了更新视图
    useEffect(() => {
      store.subscribe(() => {
        update({})
      })
    }, [])
    const dispatch = (action) => {
      // dispatch访问不到setAppState，因为我们把setAppState放到context里了
      // 想要让dispatch可以访问setAppState，可以声明一个Wrapper，在wrapper里返回组件，组件内可以访问context,Wrapper内定义dispatch
      setState(reducer(state, action))
      // update({})
    }
    return <Component {...props} dispatch={dispatch} state={state}></Component>
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
