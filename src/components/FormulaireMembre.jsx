import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function FormulaireMembre({ membre = null, onFermer, onSuccess }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    nom:         '',
    prenom:      '',
    email:       '',
    role:        'collaborateur',
    date_entree: '',
  })

  useEffect(() => {
    if (membre) {
      setForm({
        nom:         membre.nom         ?? '',
        prenom:      membre.prenom      ?? '',
        email:       membre.email       ?? '',
        role:        membre.role        ?? 'collaborateur',
        date_entree: membre.date_entree ?? '',
      })
    }
  }, [])

  function changer(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function soumettre() {
    if (!form.nom.trim() || !form.prenom.trim()) {
      setErreur('Le nom et le prénom sont obligatoires')
      return
    }
    if (!form.email.trim()) {
      setErreur("L'email est obligatoire")
      return
    }
    setEnvoi(true)
    setErreur('')

    const payload = {
      nom:         form.nom,
      prenom:      form.prenom,
      email:       form.email,
      role:        form.role,
      date_entree: form.date_entree || null,
    }

    if (membre) {
      const { error } = await supabase
        .from('membre')
        .update(payload)
        .eq('membre_id', membre.membre_id)

      if (error) {
        console.log('Erreur modification:', error)
        setErreur('Erreur lors de la modification')
        setEnvoi(false)
        return
      }
    } else {
      // Création
      const { error: erreurInsert } = await supabase
        .from('membre')
        .insert(payload)

      if (erreurInsert) {
        console.log('Erreur création membre:', erreurInsert)
        setErreur('Erreur lors de la création du membre')
        setEnvoi(false)
        return
      }

      // Invitation via Edge Function
      const { error: erreurInvit } = await supabase.functions.invoke('inviter-membre', {
        body: { email: form.email, nom: form.nom, prenom: form.prenom, role: form.role }
      })

      if (erreurInvit) {
        console.log('Erreur invitation:', erreurInvit)
        setErreur("Membre créé mais l'invitation mail a échoué. Vérifiez l'email.")
        setEnvoi(false)
        onSuccess()
        return
      }
    }

    setEnvoi(false)
    onSuccess()
    onFermer()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onFermer} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {membre ? 'Modifier le membre' : 'Nouveau membre'}
          </h2>
          <button onClick={onFermer} className="text-gray-400 hover:text-gray-600 text-xl font-light">✕</button>
        </div>

        <div className="p-6 space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Prénom <span className="text-red-400">*</span></label>
              <input
                name="prenom"
                value={form.prenom}
                onChange={changer}
                placeholder="Prénom"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Nom <span className="text-red-400">*</span></label>
              <input
                name="nom"
                value={form.nom}
                onChange={changer}
                placeholder="Nom"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Email <span className="text-red-400">*</span>
              {!membre && <span className="text-gray-300 ml-1">(une invitation sera envoyée)</span>}
            </label>
            <input
              name="email"
              value={form.email}
              onChange={changer}
              placeholder="email@exemple.com"
              disabled={!!membre}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Rôle</label>
            <select
              name="role"
              value={form.role}
              onChange={changer}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            >
              <option value="data_scientist">Data Scientist</option>
              <option value="data_scientist_junior">Data Scientist Jr</option>
              <option value="data_analyst">Data Analyst</option>
              <option value="data_engineer">Data Engineer</option>
              <option value="ml_engineer">ML Engineer</option>
              <option value="chef_de_projet">Chef de projet</option>
              <option value="stagiaire">Stagiaire</option>
              <option value="collaborateur">Collaborateur</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Date d'entrée</label>
            <input
              name="date_entree"
              value={form.date_entree}
              onChange={changer}
              type="date"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {erreur && <p className="text-xs text-red-500">{erreur}</p>}

        </div>

        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            onClick={onFermer}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={soumettre}
            disabled={envoi}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {envoi ? 'Enregistrement...' : membre ? 'Enregistrer' : 'Créer et inviter'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default FormulaireMembre