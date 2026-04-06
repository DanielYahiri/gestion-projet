import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function FormulairePhase({ onFermer, onSuccess, phaseExistante, projetId }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const [form, setForm] = useState({
    nom:         phaseExistante?.nom         || '',
    description: phaseExistante?.description || '',
    ordre:       phaseExistante?.ordre       || '',
  })

  useEffect(() => {
    // Pré-remplissage uniquement au montage — [] vide intentionnel
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    if (!form.nom.trim()) { setErreur('Le nom de la phase est requis.'); return }
    if (!form.ordre)      { setErreur("L'ordre est requis."); return }
    setErreur('')
    setEnvoi(true)

    const payload = {
      nom:         form.nom,
      description: form.description || null,
      ordre:       Number(form.ordre),
      projet_id:   projetId,
    }

    let error
    if (phaseExistante) {
      const res = await supabase
        .from('phase')
        .update(payload)
        .eq('phase_id', phaseExistante.phase_id)
      error = res.error
    } else {
      const res = await supabase
        .from('phase')
        .insert(payload)
      error = res.error
    }

    if (error) {
      console.log('Erreur phase:', error)
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
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onFermer}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-screen overflow-y-auto">

        {/* En-tête */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {phaseExistante ? 'Modifier la phase' : 'Nouvelle phase'}
          </h2>
          <button
            onClick={onFermer}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
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
              Nom de la phase <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              placeholder="Ex: Collecte des données"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Décrivez cette phase..."
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          {/* Ordre */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">
              Ordre <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="ordre"
              value={form.ordre}
              onChange={handleChange}
              placeholder="Ex: 1"
              min="1"
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
            {envoi ? 'Enregistrement...' : phaseExistante ? 'Modifier' : 'Créer la phase'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default FormulairePhase 