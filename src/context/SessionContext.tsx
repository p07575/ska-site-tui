import { createContext, useContext, type ParentProps } from "solid-js"

export interface SessionInfo {
  username: string
  method: string
  fingerprint?: string
  publicKey?: { algorithm: string; blob: Buffer }
  remoteAddress: { address: string; port?: number }
  term: string
  cols: number
  rows: number
  hasPty: boolean
}

export interface SessionContextValue extends SessionInfo {
  endSession: () => void
}

const SessionContext = createContext<SessionContextValue>()

export function SessionProvider(
  props: ParentProps & { session: SessionInfo; endSession: () => void },
) {
  return (
    <SessionContext.Provider
      value={{ ...props.session, endSession: props.endSession }}
    >
      {props.children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext)
  if (!value) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return value
}
