import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Chargement from '../components/Chargement'
import FormulaireClient from '../components/FormulaireClient'

function BadgeStatut({ statut }) {
  const labels = {
    en_cours:   'En cours',
    terminé:    'Terminé',
    en_attente: 'En attente',
    annulé:     'Annulé',
  }
  return (
    <span className="text-xs font-medium text-gray-500">
      {labels[statut]}
    </span>
  )
}

function BadgePaiement({ statut }) {
  const styles = {
    a_jour:     'text-green-600',
    en_attente: 'text-amber-500',
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

function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [projets, setProjets] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

    async function chargerDonnees() {
    const { data: dataClient, error: errClient } = await supabase
      .from('vue_client_complet')
      .select('*')
      .eq('client_id', id)
      .single()

    if (errClient) { console.log('Erreur client:', errClient); return }
    setClient(dataClient)

    const { data: dataProjets, error: errProjets } = await supabase
      .from('vue_projet_complet')
      .select('*')
      .eq('client_id', id)

    if (errProjets) { console.log('Erreur projets:', errProjets); return }
    setProjets(dataProjets)
    setChargement(false)
  }

  useEffect(() => { chargerDonnees() }, [id])
    chargerDonnees()


  if (!client) return <div className="p-8"><Chargement nombre={3} /></div>

  return (
    <div className="max-w-6xl mx-auto">

      {/* Retour */}
      <button
       onClick={() => navigate(-1)}
       className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 hover:border-indigo-300 px-4 py-2 rounded-lg transition-all mb-6"
       >
  ← Retour
     </button>

      {/* En-tête client */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.client_nom}</h1>
            <p className="text-sm text-gray-400 mt-1">{client.secteur_activite}</p>
          </div>
          <div className="flex items-center gap-3">
          <BadgePaiement statut={client.statut_paiement_global} />
          <button
          onClick={() => setFormulaireOuvert(true)}
           className="text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-all"
           >
           Modifier
        </button>
        </div>
        </div>
        {/* Dernier projet en cours */}
{client.dernier_projet_en_cours && (
  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
    <p className="text-xs text-gray-400">Projet en cours</p>
    <p className="text-sm font-medium text-indigo-600">
      {client.dernier_projet_en_cours}
    </p>
  </div>
)}
        {/* Infos contact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="text-sm font-medium text-gray-700">{client.email_contact ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Téléphone</p>
            <p className="text-sm font-medium text-gray-700">{client.telephone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Adresse</p>
            <p className="text-sm font-medium text-gray-700">{client.adresse ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Premier contrat</p>
            <p className="text-sm font-medium text-gray-700">{client.date_premier_contrat ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{client.nb_projets_total}</p>
          <p className="text-xs text-gray-400 mt-1">Projets total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{client.nb_projets_en_cours}</p>
          <p className="text-xs text-gray-400 mt-1">En cours</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{client.nb_projets_termines}</p>
          <p className="text-xs text-gray-400 mt-1">Terminés</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">
            {client.montant_total_facture.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-gray-400 mt-1">FCFA facturés</p>
        </div>
      </div>

      {/* Liste des projets */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Projets ({projets.length})
        </h2>
        {projets.length === 0 && (
          <p className="text-gray-400 text-sm">Aucun projet pour ce client.</p>
        )}
        <div className="space-y-3">
          {projets.map(projet => (
            <div
              key={projet.projet_id}
              onClick={() => navigate(`/projets/${projet.projet_id}`)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm hover:border-indigo-200 transition-all cursor-pointer flex justify-between items-center group"
            >
              <div>
                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {projet.projet_nom}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {projet.date_debut} → {projet.date_fin}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xs text-gray-400">{projet.type_donnees}</p>
                <BadgeStatut statut={projet.statut} />
              </div>
            </div>
          ))}
        {formulaireOuvert && (
        <FormulaireClient
          client={client}
          onFermer={() => setFormulaireOuvert(false)}
          onSuccess={() => chargerDonnees()}
        />
      )}
          
        </div>
      </div>

    </div>
  )
}

export default ClientDetail