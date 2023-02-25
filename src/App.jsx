// 请从课程简介里下载本代码
import React, { useState, useContext } from "react"

const appContext = React.createContext(null)
export const App = () => {
  const [appState, setAppState] = useState({
    user: { name: "frank", age: 18 },
  })
  const contextValue = { appState, setAppState }
  return (
    <appContext.Provider value={contextValue}>
      <大儿子 />
      <二儿子 />
      <幺儿子 />
    </appContext.Provider>
  )
}
const 大儿子 = () => (
  <section>
    大儿子
    <User />
  </section>
)
const 二儿子 = () => (
  <section>
    二儿子
    <UserModifier />
  </section>
)
const 幺儿子 = () => <section>幺儿子</section>
const User = () => {
  const contextValue = useContext(appContext)
  return <div>User:{contextValue.appState.user.name}</div>
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
const UserModifier = () => {
  const { appState, setAppState } = useContext(appContext)
  const onChange = (e) => {
    /**
     * 这里直接修改了原始state，创建过程不太规范
     **/
    // appState.user.name = e.target.value
    // setAppState({ ...appState }) // 这里不能是appState，因为引用相同导致setState不成功
    setAppState(
      reducer(appState, {
        type: "updateUser",
        payload: { name: e.target.value },
      })
    )
  }
  return (
    <div>
      <input value={appState.user.name} onChange={onChange} />
    </div>
  )
}
