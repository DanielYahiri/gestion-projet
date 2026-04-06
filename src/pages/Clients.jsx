import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Chargement from '../components/Chargement'
import FormulaireClient from '../components/FormulaireClient'

// Badge statut paiement global
function BadgePaiement({ statut }) {
  const styles = {
    a_jour:     'text-green-600',
    en_attente: 'text-black-500',
    en_retard:  'text-red-500',
  }
  const labels = {
    a_jour:     'À jour',
    en_attente: 'En attente',
    en_retard:  'En retard',
  }
  return (
    <span className={`text-xs font-medium ${styles[statut]}`}>
      {labels[statut]}
    </span>
  )
}

function Clients() {
  const [clients, setClients] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const navigate = useNavigate()

  async function chargerClients() {
    const { data, error } = await supabase
      .from('vue_client_complet')
      .select('*')
      .order('client_nom', { ascending: true })
    if (error) { console.log('Erreur :', error); return }
    setClients(data)
    setChargement(false)
  }

  useEffect(() => { chargerClients() }, [])

  return (
    <div className="max-w-6xl mx-auto">

      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-1">{clients.length} client(s)</p>
        </div>
        <button
          onClick={() => setFormulaireOuvert(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
         >
         + Nouveau client
        </button>
      </div>

      {chargement && <Chargement nombre={3} />}

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(client => (
          <div
            key={client.client_id}
            onClick={() => navigate(`/clients/${client.client_id}`)}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
          >
            {/* En-tête carte */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {client.client_nom}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{client.secteur_activite}</p>
              </div>
              <BadgePaiement statut={client.statut_paiement_global} />
            </div>

            {/* Stats projets */}
            <div className="grid grid-cols-3 gap-2 my-4 py-3 border-y border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">{client.nb_projets_total}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{client.nb_projets_en_cours}</p>
                <p className="text-xs text-gray-400">En cours</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{client.nb_projets_termines}</p>
                <p className="text-xs text-gray-400">Terminés</p>
              </div>
            </div>

            {/* Dernier projet */}
            {client.dernier_projet_en_cours && (
              <div className="mb-3">
                <p className="text-xs text-gray-400">Projet en cours</p>
                <p className="text-sm font-medium text-gray-700 truncate">
                  {client.dernier_projet_en_cours}
                </p>
              </div>
            )}

            {/* Montant facturé */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Total facturé</p>
              <p className="text-sm font-semibold text-gray-700">
                {client.montant_total_facture.toLocaleString('fr-FR')} FCFA
              </p>
            </div>

          </div>
        ))}

        {formulaireOuvert && (
          <FormulaireClient
            onFermer={() => setFormulaireOuvert(false)}
            onSuccess={() => chargerClients()}
          />
        )}
      </div>
    </div>
  )
}

export default Clients