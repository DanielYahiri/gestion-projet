import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

function PageNouveauMotDePasse() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ motDePasse: '', confirmation: '' })
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [sessionPrete, setSessionPrete] = useState(false)

  useEffect(() => {
  // Supabase v2 consomme le hash automatiquement
  // On écoute juste l'événement auth qui arrive après
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('EVENT auth:', event, session)
      if (event === 'SIGNED_IN' && session) {
        setSessionPrete(true)
      }
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionPrete(true)
      }
    }
  )

  // Vérifier aussi si session déjà active
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('SESSION:', session)
    if (session) {
      setSessionPrete(true)
    }
  })

  return () => subscription.unsubscribe()
}, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErreur('')
  }

  async function handleSubmit() {
    if (!form.motDePasse.trim()) {
      setErreur('Le mot de passe est requis.')
      return
    }
    if (form.motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (form.motDePasse !== form.confirmation) {
      setErreur('Les mots de passe ne correspondent pas.')
      return
    }
    setErreur('')
    setEnvoi(true)

    const { error } = await supabase.auth.updateUser({
      password: form.motDePasse
    })

    if (error) {
      setErreur('Erreur lors de la mise à jour. Réessayez.')
      setEnvoi(false)
      return
    }

    setSucces('Mot de passe mis à jour avec succès !')
    setEnvoi(false)

    setTimeout(async () => {
      await supabase.auth.signOut()
      navigate('/connexion')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">D</span>
          </div>
          <span className="font-bold text-gray-800 text-lg">DataFlow</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Nouveau mot de passe</h1>
        <p className="text-sm text-gray-400 mb-6">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        {/* Session pas encore prête */}
        {!sessionPrete && !succes && !erreur && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-amber-600">Vérification du lien en cours...</p>
          </div>
        )}

        {/* Erreur */}
        {erreur && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-red-600">{erreur}</p>
          </div>
        )}

        {/* Succès */}
        {succes && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-green-600">{succes}</p>
            <p className="text-xs text-green-500 mt-1">Redirection vers la connexion...</p>
          </div>
        )}

        {/* Formulaire — affiché uniquement si session prête */}
        {sessionPrete && !succes && (
          <>
            <div className="mb-4">
              <label className="text-xs text-gray-500 font-medium block mb-1">
                Nouveau mot de passe <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="motDePasse"
                value={form.motDePasse}
                onChange={handleChange}
                placeholder="Min. 8 caractères"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="mb-6">
              <label className="text-xs text-gray-500 font-medium block mb-1">
                Confirmer le mot de passe <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="confirmation"
                value={form.confirmation}
                onChange={handleChange}
                placeholder="Répétez le mot de passe"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={envoi}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {envoi ? 'Mise à jour...' : 'Enregistrer le mot de passe'}
            </button>
          </>
        )}

      </div>
    </div>
  )
}

export default PageNouveauMotDePasse