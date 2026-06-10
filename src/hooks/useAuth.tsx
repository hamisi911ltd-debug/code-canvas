import { createContext, useContext } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAuthState, signOutFn } from '@/server-functions/auth'
import type { SessionUser } from '@/lib/auth'

interface AuthContextValue {
  user: SessionUser | null
  isLoading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAdmin: false,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth-state'],
    queryFn: () => getAuthState(),
    staleTime: 60_000,
    retry: false,
  })

  const signOut = async () => {
    await signOutFn()
    qc.setQueryData(['auth-state'], null)
    qc.invalidateQueries()
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAdmin: user?.isAdmin ?? false,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
