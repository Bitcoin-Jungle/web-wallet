import { useContext, createContext } from "react"

export type AuthIdentity = {
  token: string
}

export type AuthSession = {
  identity: AuthIdentity
} | null

export type KratosCookieResp = {
  kratosUserId: string
  phone: string
}

type AuthContextType = {
  isAuthenticated: boolean
  authIdentity?: AuthIdentity
  setAuthSession: (session: AuthSession) => void
  syncSession: () => Promise<boolean>
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  authIdentity: undefined,
  setAuthSession: () => {},
  syncSession: () => Promise.resolve(true),
})

export const useAuthContext: () => AuthContextType = () => {
  return useContext<AuthContextType>(AuthContext)
}
