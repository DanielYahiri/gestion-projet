import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function FormulaireTache({ tache = null, projetId, onFermer, onSuccess }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [phases, setPhases] = useState([])
  const [membres, setMembres] = useState([])
  const [membresSelectionnes, setMembresSelectionnes] = useState([])
  const [form, setForm] = useState({
    titre:         '',
    description:   '',
    statut:        'a_faire',
    priorite:      'moyenne',
    date_debut:    '',
    date_echeance: '',
    phase_id:      '',
  })

  useEffect(() => {
    // Charger phases et membres
    async function chargerOptions() {
      const { data: dataPhases } = await supabase
        .from('phase')
        .select('phase_id, nom')
        .eq('projet_id', projetId)
        .order('ordre')
      setPhases(dataPhases || [])

      const { data: dataMembres } = await supabase
        .from('membre')
        .select('membre_id, nom, prenom')
        .order('nom')
      setMembres(dataMembres || [])
    }
    chargerOptions()

    // Pré-remplir si modification
    if (tache) {
      setForm({
        titre:         tache.titre         ?? '',
        description:   tache.description   ?? '',
        statut:        tache.statut        ?? 'a_faire',
        priorite:      tache.priorite      ?? 'moyenne',
        date_debut:    tache.date_debut     ?? '',
        date_echeance: tache.date_echeance  ?? '',
        phase_id:      tache.phase_id       ?? '',
      })
      // Pré-remplir membres affectés
      const membresExistants = Array.isArray(tache.membres_affectes)
        ? tache.membres_affectes
        : JSON.parse(tache.membres_affectes || '[]')
      setMembresSelectionnes(membresExistants.map(m => m.membre_id))
    }
  }, [])

  function changer(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function toggleMembre(membreId) {
    setMembresSelectionnes(prev =>
      prev.includes(membreId)
        ? prev.filter(id => id !== membreId)
        : [...prev, membreId]
    )
  }

  async function soumettre() {
    if (!form.titre.trim()) { setErreur('Le titre est obligatoire'); return }
    setEnvoi(true)
    setErreur('')

    const payload = {
      titre:         form.titre,
      description:   form.description   || null,
      statut:        form.statut,
      priorite:      form.priorite,
      date_debut:    form.date_debut     || null,
      date_echeance: form.date_echeance  || null,
      phase_id:      form.phase_id       || null,
      projet_id:     projetId,
    }

    let tacheId = tache?.tache_id

    if (tache) {
      // Modification
      const { error } = await supabase
        .from('tache')
        .update(payload)
        .eq('tache_id', tacheId)

      if (error) {
        console.log('Erreur modification:', error)
        setErreur('Erreur lors de la modification')
        setEnvoi(false)
        return
      }
    } else {
      // Création
      const { data, error } = await supabase
        .from('tache')
        .insert(payload)
        .select('tache_id')
        .single()

      if (error) {
        console.log('Erreur création:', error)
        setErreur('Erreur lors de la création')
        setEnvoi(false)
        return
      }
      tacheId = data.tache_id
    }

    // Gérer les affectations membres
    if (tache) {
      // Supprimer les anciennes affectations
      await supabase
        .from('affectation')
        .delete()
        .eq('tache_id', tacheId)
    }

    // Insérer les nouvelles affectations
    if (membresSelectionnes.length > 0) {
      const affectations = membresSelectionnes.map(membreId => ({
        tache_id:  tacheId,
        membre_id: membreId,
      }))
      const { error: errAff } = await supabase
        .from('affectation')
        .insert(affectations)

      if (errAff) console.log('Erreur affectations:', errAff)
    }

    setEnvoi(false)
    onSuccess()
    onFermer()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onFermer} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">

        {/* En-tête */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {tache ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <button onClick={onFermer} className="text-gray-400 hover:text-gray-600 text-xl font-light">✕</button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4">

          {/* Titre */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Titre <span className="text-red-400">*</span></label>
            <input
              name="titre"
              value={form.titre}
              onChange={changer}
              placeholder="Titre de la tâche"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={changer}
              placeholder="Description de la tâche..."
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          {/* Statut + Priorité */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Statut</label>
              <select
                name="statut"
                value={form.statut}
                onChange={changer}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              >
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="bloque">Bloqué</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Priorité</label>
              <select
                name="priorite"
                value={form.priorite}
                onChange={changer}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              >
                <option value="haute">Haute</option>
                <option value="moyenne">Moyenne</option>
                <option value="basse">Basse</option>
              </select>
            </div>
          </div>

          {/* Date début + Échéance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date début</label>
              <input
                type="date"
                name="date_debut"
                value={form.date_debut}
                onChange={changer}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Échéance</label>
              <input
                type="date"
                name="date_echeance"
                value={form.date_echeance}
                onChange={changer}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Phase */}
          {phases.length > 0 && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Phase</label>
              <select
                name="phase_id"
                value={form.phase_id}
                onChange={changer}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              >
                <option value="">Aucune phase</option>
                {phases.map(p => (
                  <option key={p.phase_id} value={p.phase_id}>{p.nom}</option>
                ))}
              </select>
            </div>
          )}

          {/* Membres */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Membres assignés</label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {membres.map(m => (
                <div
                  key={m.membre_id}
                  onClick={() => toggleMembre(m.membre_id)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    membresSelectionnes.includes(m.membre_id)
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-indigo-600">
                      {m.prenom?.[0]}{m.nom?.[0]}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">{m.prenom} {m.nom}</span>
                  {membresSelectionnes.includes(m.membre_id) && (
                    <span className="ml-auto text-indigo-500 text-xs">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

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
            {envoi ? 'Enregistrement...' : tache ? 'Enregistrer' : 'Créer la tâche'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default FormulaireTache