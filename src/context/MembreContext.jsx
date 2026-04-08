import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'

const MembreContext = createContext(null)

export function MembreProvider({ children }) {
  const [membreActif, setMembreActif] = useState(null)
  const [chargementAuth, setChargementAuth] = useState(true)
  const dejaCherche = useRef(false)

  async function chargerMembre(userId) {
    try {
      const { data, error } = await supabase
        .from('membre')
        .select('*')
        .eq('auth_id', userId)
        .single()

      if (error) {
        setMembreActif(null)
      } else {
        setMembreActif(data)
      }
    } catch (e) {
      setMembreActif(null)
    } finally {
      setChargementAuth(false)
    }
  }

  useEffect(() => {
    // ✅ Timeout de sécurité : si Supabase ne répond pas en 5s, on arrête le chargement
    const timeout = setTimeout(() => {
      setChargementAuth(false)
    }, 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        clearTimeout(timeout) // ✅ Annule le timeout si Supabase répond
        
        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            dejaCherche.current = true
            await chargerMembre(session.user.id)
          } else {
            setMembreActif(null)
            setChargementAuth(false)
          }
        } else if (event === 'SIGNED_IN') {
          if (!dejaCherche.current) {
            dejaCherche.current = true
            await chargerMembre(session.user.id)
          } else {
            setChargementAuth(false)
          }
        } else if (event === 'SIGNED_OUT') {
          dejaCherche.current = false
          setMembreActif(null)
          setChargementAuth(false)
        } else {
          setChargementAuth(false)
        }
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function deconnexion() {
    await supabase.auth.signOut()
    setMembreActif(null)
  }

  return (
    <MembreContext.Provider value={{ membreActif, chargementAuth, deconnexion }}>
      {children}
    </MembreContext.Provider>
  )
}

export function useMembreActif() {
  return useContext(MembreContext)
}