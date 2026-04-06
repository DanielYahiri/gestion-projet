import { useState } from 'react'
import { supabase } from '../supabase'

function PageConnexion() {
  const [mode, setMode] = useState('connexion') // 'connexion' | 'reinitialisation'
  const [form, setForm] = useState({ email: '', motDePasse: '' })
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [envoi, setEnvoi] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErreur('')
    setSucces('')
  }

  function basculerMode() {
    setMode(mode === 'connexion' ? 'reinitialisation' : 'connexion')
    setErreur('')
    setSucces('')
  }

  async function handleConnexion() {
    if (!form.email.trim() || !form.motDePasse.trim()) {
      setErreur('Email et mot de passe requis.')
      return
    }
    setErreur('')
    setEnvoi(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.motDePasse,
    })

    if (error) {
      setErreur('Email ou mot de passe incorrect.')
      setEnvoi(false)
      return
    }

    setEnvoi(false)
    // MembreContext détecte automatiquement via onAuthStateChange
  }

  async function handleReinitialisation() {
    if (!form.email.trim()) {
      setErreur('Veuillez entrer votre email.')
      return
    }
    setErreur('')
    setEnvoi(true)

    // 1. Vérifier que l'email existe dans la table membre
    const { data, error } = await supabase
      .from('membre')
      .select('membre_id')
      .eq('email', form.email.trim())
      .single()

    if (error || !data) {
      setErreur('Aucun compte trouvé avec cet email.')
      setEnvoi(false)
      return
    }

    // 2. Envoyer le lien — redirige vers /nouveau-mot-de-passe
    const { error: erreurReset } = await supabase.auth.resetPasswordForEmail(
      form.email.trim(),
      { redirectTo: window.location.origin + '/nouveau-mot-de-passe' }
    )

    if (erreurReset) {
      setErreur("Erreur lors de l'envoi. Réessayez.")
      setEnvoi(false)
      return
    }

    setSucces('Lien envoyé ! Vérifiez votre boîte mail.')
    setEnvoi(false)
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

        {/* Titre */}
        {mode === 'connexion' ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Connexion</h1>
            <p className="text-sm text-gray-400 mb-6">Accès sur invitation uniquement.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Mot de passe oublié</h1>
            <p className="text-sm text-gray-400 mb-6">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>
          </>
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
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 font-medium block mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="votre@email.com"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Mot de passe — uniquement en mode connexion */}
        {mode === 'connexion' && (
          <div className="mb-6">
            <label className="text-xs text-gray-500 font-medium block mb-1">Mot de passe</label>
            <input
              type="password"
              name="motDePasse"
              value={form.motDePasse}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              onKeyDown={e => e.key === 'Enter' && handleConnexion()}
            />
          </div>
        )}

        {/* Bouton principal */}
        <button
          onClick={mode === 'connexion' ? handleConnexion : handleReinitialisation}
          disabled={envoi}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors mb-4"
        >
          {envoi
            ? (mode === 'connexion' ? 'Connexion...' : 'Envoi...')
            : (mode === 'connexion' ? 'Se connecter' : 'Envoyer le lien')
          }
        </button>

        {/* Lien bascule */}
        <p className="text-center text-xs text-gray-400">
          {mode === 'connexion' ? (
            <>
              Mot de passe oublié ?{' '}
              <button
                onClick={basculerMode}
                className="text-indigo-500 hover:text-indigo-700 font-medium"
              >
                Réinitialiser
              </button>
            </>
          ) : (
            <>
              <button
                onClick={basculerMode}
                className="text-indigo-500 hover:text-indigo-700 font-medium"
              >
                ← Retour à la connexion
              </button>
            </>
          )}
        </p>

      </div>
    </div>
  )
}

export default PageConnexion