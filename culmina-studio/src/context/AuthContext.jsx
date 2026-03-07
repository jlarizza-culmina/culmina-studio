import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [endUser, setEndUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchEndUser(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchEndUser(session.user.id)
        else { setEndUser(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function fetchEndUser(supabaseUid) {
    const { data, error } = await supabase
      .from('endusers')
      .select('*, contacts(*)')
      .eq('supabase_uid', supabaseUid)
      .single()
    if (!error && data) setEndUser(data)
    setLoading(false)
  }

  async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    return await supabase.auth.signOut()
  }

  const displayName = endUser?.contacts?.nickname
    || endUser?.contacts?.firstname
    || endUser?.loginname
    || ''

  return (
    <AuthContext.Provider value={{ user, endUser, displayName, isSysAdmin: false, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
