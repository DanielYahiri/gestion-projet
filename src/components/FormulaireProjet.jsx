import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function FormulaireProjet({ onFermer, onSuccess, projetExistant }) {
  const [clients, setClients] = useState([])
  const [membres, setMembres] = useState([])
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [chargementForm, setChargementForm] = useState(true)

  const [form, setForm] = useState({
    nom:             projetExistant?.projet_nom      || '',
    description:     projetExistant?.description     || '',
    date_debut:      projetExistant?.date_debut      || '',
    date_fin:        projetExistant?.date_fin        || '',
    statut:          projetExistant?.statut          || 'en_attente',
    type_donnees:    projetExistant?.type_donnees    || '',
    montant_facture: projetExistant?.montant_facture || '',
    date_facturation: projetExistant?.date_facturation || '', 
    statut_paiement: projetExistant?.statut_paiement || 'en_attente',
    client_id:       projetExistant?.client_id       || '',
    membre_id:   projetExistant?.membre_id   || '',
  })

  useEffect(() => {
    async function chargerDonnees() {
      const { data: dataClients } = await supabase
        .from('client')
        .select('client_id, nom')
        .order('nom')

      const { data: dataMembres } = await supabase
        .from('membre')
        .select('membre_id, nom, prenom, role')
        .order('nom')

      setClients(dataClients || [])
      setMembres(dataMembres || [])
      setChargementForm(false)
    }
    chargerDonnees()
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    if (!form.nom.trim())  { setErreur('Le nom du projet est requis.'); return }
    if (!form.client_id)   { setErreur('Veuillez sélectionner un client.'); return }
    if (!form.date_debut)  { setErreur('La date de début est requise.'); return }
    setErreur('')
    setEnvoi(true)

    const payload = {
      nom:             form.nom,
      description:     form.description     || null,
      date_debut:      form.date_debut,
      date_fin:        form.date_fin        || null,
      statut:          form.statut,
      type_donnees:    form.type_donnees    || null,
      montant_facture: form.montant_facture ? Number(form.montant_facture) : 0,
      date_facturation: form.date_facturation || null,
      statut_paiement: form.statut_paiement,
      client_id:       form.client_id,
      membre_id:   form.membre_id   || null,
    }

    let error
    if (projetExistant) {
      const res = await supabase
        .from('projet')
        .update(payload)
        .eq('projet_id', projetExistant.projet_id)
      error = res.error
    } else {
      const res = await supabase
        .from('projet')
        .insert(payload)
      error = res.error
    }

    if (error) {
      console.log('Erreur:', error)
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
            {projetExistant ? 'Modifier le projet' : 'Nouveau projet'}
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

          {chargementForm ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-gray-100 rounded-lg w-full" />
              <div className="h-20 bg-gray-100 rounded-lg w-full" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-8 bg-gray-100 rounded-lg" />
                <div className="h-8 bg-gray-100 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-8 bg-gray-100 rounded-lg" />
                <div className="h-8 bg-gray-100 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-8 bg-gray-100 rounded-lg" />
                <div className="h-8 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ) : (
            <>
              {erreur && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600">{erreur}</p>
                </div>
              )}

              {/* Nom */}
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">
                  Nom du projet <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  placeholder="Ex: Segmentation clients Orange CI"
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
                  placeholder="Décrivez le projet..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400 resize-none"
                />
              </div>

              {/* Client + Obtenu par */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">
                    Client <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="client_id"
                    value={form.client_id}
                    onChange={handleChange}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
                  >
                    <option value="">Sélectionner...</option>
                    {clients.map(c => (
                      <option key={c.client_id} value={c.client_id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Obtenu par</label>
                  <select
                    name="membre_id"
                    value={form.membre_id}
                    onChange={handleChange}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
                  >
                    <option value="">Sélectionner...</option>
                    {membres.map(m => (
                      <option key={m.membre_id} value={m.membre_id}>
                        {m.prenom} {m.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">
                    Date début <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_debut"
                    value={form.date_debut}
                    onChange={handleChange}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Date fin</label>
                  <input
                    type="date"
                    name="date_fin"
                    value={form.date_fin}
                    onChange={handleChange}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Statut + Type données */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Statut</label>
                  <select
                    name="statut"
                    value={form.statut}
                    onChange={handleChange}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
                  >
                    <option value="en_attente">En attente</option>
                    <option value="en_cours">En cours</option>
                    <option value="terminé">Terminé</option>
                    <option value="annulé">Annulé</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Type de données</label>
                  <input
                    type="text"
                    name="type_donnees"
                    value={form.type_donnees}
                    onChange={handleChange}
                    placeholder="Ex: données CRM"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Montant facturé + Statut paiement */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">
                    Montant facturé (FCFA)
                  </label>
                  <input
                    type="number"
                    name="montant_facture"
                    value={form.montant_facture}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                <div>
               <label className="text-xs text-gray-500 font-medium block mb-1">
               Date de facturation
             </label>
            <input
          type="date"
          name="date_facturation"
          value={form.date_facturation}
          onChange={handleChange}
           className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
         />

         
              </div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Statut paiement</label>
                  <select
                    name="statut_paiement"
                    value={form.statut_paiement}
                    onChange={handleChange}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
                  >
                    <option value="en_attente">En attente</option>
                    <option value="payee">Payée</option>
                    <option value="en_retard">En retard</option>
                  </select>
                </div>
              </div>
            </>
          )}

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
            disabled={envoi || chargementForm}
            className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 px-6 py-2 rounded-lg transition-colors font-medium"
          >
            {envoi ? 'Enregistrement...' : projetExistant ? 'Modifier' : 'Créer le projet'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default FormulaireProjet