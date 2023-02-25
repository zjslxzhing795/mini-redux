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
