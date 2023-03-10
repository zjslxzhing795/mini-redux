import React from "react"
import { Provider, createStore, connect } from "./redux"
import { connectToUser } from "./connectors"

const initState = {
  user: { name: "frank", age: 18 },
  group: { name: "前端组" },
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
const store = createStore(reducer, initState)
export const App = () => {
  // 调用这里的setAppState会导致所有组件都更新，解决办法是不使用它，创建一个store，调用store里的setState方法，用setState({})的方式通知react更新视图
  // const [appState, setAppState] = useState({
  //   user: { name: "frank", age: 18 },
  // })
  // const contextValue = { appState, setAppState }

  // 使用useMemo可以让幺儿子缓存起来不随state变化而执行
  // const x = useMemo(() => {
  //   return <幺儿子 />
  // }, [])
  return (
    // <appContext.Provider value={store}>
    //   <大儿子 />
    //   <二儿子 />
    //   <幺儿子 />
    //   {/* {x} */}
    // </appContext.Provider>
    <Provider store={store}>
      <大儿子 />
      <二儿子 />
      <幺儿子 />
    </Provider>
  )
}
const 大儿子 = () => {
  console.log("大儿子执行了" + Math.random())
  return (
    <section>
      大儿子
      <User />
    </section>
  )
}

const 二儿子 = () => {
  console.log("二儿子执行了" + Math.random())
  return (
    <section>
      二儿子
      <UserModifier>content</UserModifier>
      {/* <Wrapper /> */}
    </section>
  )
}

const 幺儿子 = connect((state) => {
  return {
    group: state.group,
  }
})(({ group }) => {
  console.log("幺儿子执行了" + Math.random())
  return (
    <section>
      幺儿子
      <div>group:{group.name}</div>
    </section>
  )
})

const User = connectToUser(({ dispatch, user }) => {
  console.log("User执行了" + Math.random())
  // const { state } = useContext(appContext)
  return <div>User:{user.name}</div>
})

const _UserModifier = ({ dispatch, state }) => {
  // const { appState, setAppState } = useContext(appContext)
  const onChange = (e) => {
    /**
     * 0. 这里直接修改了原始state，创建过程不太规范
     **/
    // appState.user.name = e.target.value
    // setAppState({ ...appState }) // 这里不能是appState，因为引用相同导致setState不成功

    /**
     * 1. 每次 setAppState 传入的都是 reduce(appState, {type: xx, payload: xx}),重复的东西很多,只有{type: xx, payload: xx}不一样
     **/
    // setAppState(
    //   reducer(appState, {
    //     type: "updateUser",
    //     payload: { name: e.target.value },
    //   })
    // )

    dispatch({
      type: "updateUser",
      payload: { name: e.target.value },
    })
  }
  return (
    <div>
      <input value={state.user.name} onChange={onChange} />
    </div>
  )
}
// const Wrapper = createWrapper(UserModifier) Wrapper命名改为UserModifier createWrapper改为connect
// const UserModifier = connect(_UserModifier) 将_UserModifier替换，props增加childeen

const ajax = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ data: { name: "3秒后的frank" } })
    }, 3000)
  })
}
const fetchUser = (dispatch) => {
  ajax("/user").then((response) => {
    dispatch({ type: "updateUser", payload: response.data })
  })
}
const fetchUserPromise = () => {
  return ajax("/user").then((response) => response.data)
}
const UserModifier = connect(
  null,
  null
)(({ dispatch, state, children }) => {
  console.log("UserModifier执行了" + Math.random())
  // const { appState, setAppState } = useContext(appContext)
  const onChange = (e) => {
    /**
     * 0. 这里直接修改了原始state，创建过程不太规范
     **/
    // appState.user.name = e.target.value
    // setAppState({ ...appState }) // 这里不能是appState，因为引用相同导致setState不成功

    /**
     * 1. 每次 setAppState 传入的都是 reduce(appState, {type: xx, payload: xx}),重复的东西很多,只有{type: xx, payload: xx}不一样
     **/
    // setAppState(
    //   reducer(appState, {
    //     type: "updateUser",
    //     payload: { name: e.target.value },
    //   })
    // )

    /**
     * 2. dispatch通过connect高阶函数返回
     * 如果不使用updateUser精确获取userDispatch的话，只需要connect(userSelector, null)，然后调用下面的dispatch方法即可
     */
    dispatch({
      type: "updateUser",
      payload: { name: e.target.value },
    })
    // updateUser({
    //   name: e.target.value,
    // })
  }
  const onClick = (e) => {
    // fetchUser(dispatch) // 1.0版本 这样其实就可以完成，但是这么做不符合直觉，应为dispatch(fetchUser)
    // dispatch(fetchUser) // 2.0版本 fetchUser不是{type: xx, payload: xx}这样的对象，而是一个函数，所以要实现支持异步，则需要让dispatch支持函数
    // 3.0版本 异步放payload里
    dispatch({
      type: "updateUser",
      payload: fetchUserPromise(),
    })
  }
  return (
    <div>
      {children}
      <input value={state.user.name} onChange={onChange} />
      <button onClick={onClick}>异步获取user</button>
    </div>
  )
})
