// src/components/FormulaireLivrable.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function FormulaireLivrable({ onFermer, onSuccess, livrableExistant, projetId }) {
  const [phases, setPhases] = useState([])
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const [form, setForm] = useState({
    nom:                  livrableExistant?.livrable_nom          || '',
    type:                 livrableExistant?.type                  || 'rapport',
    date_livraison:       livrableExistant?.date_livraison        || '',
    phase_id:             livrableExistant?.phase_id              || '',
    lien_fiche_technique:   livrableExistant?.lien_fiche_technique   || '',
    lien_fiche_presentable: livrableExistant?.lien_fiche_presentable || '',
  })

  useEffect(() => {
    async function chargerPhases() {
      const { data } = await supabase
        .from('phase')
        .select('phase_id, nom, ordre')
        .eq('projet_id', projetId)
        .order('ordre', { ascending: true })
      setPhases(data || [])
    }
    chargerPhases()
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    if (!form.nom.trim()) { setErreur('Le nom du livrable est requis.'); return }
    setErreur('')
    setEnvoi(true)

    const payload = {
      nom:                    form.nom,
      type:                   form.type,
      date_livraison:         form.date_livraison         || null,
      phase_id:               form.phase_id               || null,
      lien_fiche_technique:   form.lien_fiche_technique   || null,
      lien_fiche_presentable: form.lien_fiche_presentable || null,
      projet_id:              projetId,
    }

    let error
    if (livrableExistant) {
      const res = await supabase
        .from('livrable')
        .update(payload)
        .eq('livrable_id', livrableExistant.livrable_id)
      error = res.error
    } else {
      const res = await supabase
        .from('livrable')
        .insert(payload)
      error = res.error
    }

    if (error) {
      console.log('Erreur livrable:', error)
      setErreur('Une erreur est survenue. Veuillez réessayer.')
      setEnvoi(false)
      return
    }

    setEnvoi(false)
    onSuccess()
    onFermer()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onFermer} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-screen overflow-y-auto">

        {/* En-tête */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {livrableExistant ? 'Modifier le livrable' : 'Nouveau livrable'}
          </h2>
          <button onClick={onFermer} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4">

          {erreur && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-600">{erreur}</p>
            </div>
          )}

          {/* Nom */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">
              Nom du livrable <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              placeholder="Ex: Rapport de segmentation"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Type + Phase */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              >
                <option value="rapport">Rapport</option>
                <option value="dashboard">Dashboard</option>
                <option value="modele">Modèle</option>
                <option value="presentation">Présentation</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Phase</label>
              <select
                name="phase_id"
                value={form.phase_id}
                onChange={handleChange}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              >
                <option value="">Aucune</option>
                {phases.map(ph => (
                  <option key={ph.phase_id} value={ph.phase_id}>
                    {ph.ordre}. {ph.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date livraison */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Date de livraison</label>
            <input
              type="date"
              name="date_livraison"
              value={form.date_livraison}
              onChange={handleChange}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Liens */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Lien fiche technique</label>
            <input
              type="url"
              name="lien_fiche_technique"
              value={form.lien_fiche_technique}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Lien fiche présentable</label>
            <input
              type="url"
              name="lien_fiche_presentable"
              value={form.lien_fiche_presentable}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            />
          </div>

        </div>

        {/* Pied */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onFermer}
            className="text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={envoi}
            className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 px-6 py-2 rounded-lg transition-colors font-medium"
          >
            {envoi ? 'Enregistrement...' : livrableExistant ? 'Modifier' : 'Créer le livrable'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default FormulaireLivrable