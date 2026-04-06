import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function FormulaireClient({ client = null, onFermer, onSuccess }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    nom:                  '',
    secteur_activite:     '',
    email_contact:        '',
    telephone:            '',
    adresse:              '',
    date_premier_contrat: '',
  })

  // Si modification — pré-remplir le formulaire
  useEffect(() => {
  if (client) {
    setForm({
      nom:                  client.client_nom           ?? '',
      secteur_activite:     client.secteur_activite     ?? '',
      email_contact:        client.email_contact        ?? '',
      telephone:            client.telephone            ?? '',
      adresse:              client.adresse              ?? '',
      date_premier_contrat: client.date_premier_contrat ?? '',
    })
  }
}, [])

  function changer(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function soumettre() {
    if (!form.nom.trim()) { setErreur('Le nom est obligatoire'); return }
    setEnvoi(true)
    setErreur('')

    if (client) {
      // Modification
      const { error } = await supabase
        .from('client')
        .update({
          nom:                  form.nom,
          secteur_activite:     form.secteur_activite  || null,
          email_contact:        form.email_contact     || null,
          telephone:            form.telephone         || null,
          adresse:              form.adresse           || null,
          date_premier_contrat: form.date_premier_contrat || null,
        })
        .eq('client_id', client.client_id)

      if (error) { console.log('Erreur modification:', error); setErreur('Erreur lors de la modification'); setEnvoi(false); return }
    } else {
      // Création
      const { error } = await supabase
        .from('client')
        .insert({
          nom:                  form.nom,
          secteur_activite:     form.secteur_activite  || null,
          email_contact:        form.email_contact     || null,
          telephone:            form.telephone         || null,
          adresse:              form.adresse           || null,
          date_premier_contrat: form.date_premier_contrat || null,
        })

      if (error) { console.log('Erreur création:', error); setErreur('Erreur lors de la création'); setEnvoi(false); return }
    }

    setEnvoi(false)
    onSuccess()
    onFermer()
  }

  return (
    // Overlay
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onFermer} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg z-10">

        {/* En-tête */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {client ? 'Modifier le client' : 'Nouveau client'}
          </h2>
          <button onClick={onFermer} className="text-gray-400 hover:text-gray-600 text-xl font-light">✕</button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4">

          {/* Nom */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nom <span className="text-red-400">*</span></label>
            <input
              name="nom"
              value={form.nom}
              onChange={changer}
              placeholder="Nom du client"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Secteur */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Secteur d'activité</label>
            <input
              name="secteur_activite"
              value={form.secteur_activite}
              onChange={changer}
              placeholder="Ex : Banque, Commerce, Industrie..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Email + Téléphone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input
                name="email_contact"
                value={form.email_contact}
                onChange={changer}
                placeholder="email@exemple.com"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Téléphone</label>
              <input
                name="telephone"
                value={form.telephone}
                onChange={changer}
                placeholder="+225 00 00 00 00"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Adresse */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Adresse</label>
            <input
              name="adresse"
              value={form.adresse}
              onChange={changer}
              placeholder="Adresse du client"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Date premier contrat */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Date premier contrat</label>
            <input
              type="date"
              name="date_premier_contrat"
              value={form.date_premier_contrat}
              onChange={changer}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Erreur */}
          {erreur && <p className="text-xs text-red-500">{erreur}</p>}

        </div>

        {/* Pied */}
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
            {envoi ? 'Enregistrement...' : client ? 'Enregistrer' : 'Créer le client'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default FormulaireClient