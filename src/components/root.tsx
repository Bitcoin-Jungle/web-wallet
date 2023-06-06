import { useEffect, useReducer } from "react"

import { GaloyClient } from "@galoymoney/client"

import { ValidPath } from "server/routes"

import { setLocale, GwwContext, GwwStateType, history, mainReducer } from "store/index"
import { KratosFlowData } from "kratos/index"

import { AuthProvider } from "components/auth-provider"
import { FirebaseProvider } from "components/firebase-provider"
import RootComponent from "components/root-component"

type RootFCT = React.FC<{ GwwState: GwwStateType }>

const Root: RootFCT = ({ GwwState }) => {
  const [state, dispatch] = useReducer(mainReducer, GwwState, (initState) => {
    setLocale(initState.defaultLanguage)
    return initState
  })

  useEffect(() => {
    const removeHistoryListener = history.listen(({ location }) => {
      const props = Object.fromEntries(new URLSearchParams(location.search))

      dispatch({
        type: "update",
        path: location.pathname as ValidPath,
        props,
        ...(location.state as Record<string, unknown> | null),
      })
    })

    return () => {
      removeHistoryListener()
    }
  }, [dispatch])

  return (
    <AuthProvider authIdentity={state.authIdentity}>
      <FirebaseProvider>
        <GwwContext.Provider value={{ state, dispatch }}>
          <RootComponent
            key={state.key}
            path={state.path}
            flowData={state.flowData}
            {...state.props}
          />
        </GwwContext.Provider>
      </FirebaseProvider>
    </AuthProvider>
  )
}

type SSRRootFCT = React.FC<{
  client: GaloyClient<unknown>
  GwwState: GwwStateType
  flowData?: KratosFlowData
}>

export const SSRRoot: SSRRootFCT = ({ client, GwwState }) => {
  const [state, dispatch] = useReducer(mainReducer, GwwState, (initState) => {
    setLocale(initState.defaultLanguage)
    return initState
  })

  return (
    <AuthProvider galoyClient={client} authIdentity={state.authIdentity}>
      <FirebaseProvider>
        <GwwContext.Provider value={{ state, dispatch }}>
          <RootComponent path={state.path} flowData={state.flowData} {...state.props} />
        </GwwContext.Provider>
      </FirebaseProvider>
    </AuthProvider>
  )
}

export default Root
