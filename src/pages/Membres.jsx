import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Chargement from '../components/Chargement'
import FormulaireMembre from '../components/FormulaireMembre'

// Badge rôle
function BadgeRole({ role }) {
  const labels = {
    data_scientist:         'Data Scientist',
    data_scientist_junior:  'Data Scientist Jr',
    data_analyst:           'Data Analyst',
    data_engineer:          'Data Engineer',
    ml_engineer:            'ML Engineer',
    chef_de_projet:         'Chef de projet',
    stagiaire:              'Stagiaire',
    collaborateur:          'Collaborateur',
  }
  return (
    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
      {labels[role] || role}
    </span>
  )
}

function Membres() {
  const [membres, setMembres] = useState([])
  const [chargement, setChargement] = useState(true)
  const navigate = useNavigate()
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

  
    async function chargerMembres() {
  const { data, error } = await supabase
    .from('vue_charge_membre')
    .select('*')
    .order('nom', { ascending: true })
  if (error) { console.log('Erreur :', error); return }
  setMembres(data)
  setChargement(false)
}

useEffect(() => { chargerMembres() }, [])
  

  return (
    <div className="max-w-6xl mx-auto">

      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membres</h1>
          <p className="text-sm text-gray-400 mt-1">{membres.length} membre(s)</p>
        </div>
        <button
          onClick={() => setFormulaireOuvert(true)}
           className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
            + Nouveau membre
          </button>
      </div>

      {chargement && <Chargement nombre={4} />}

      {/* Grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {membres.map(membre => (
          <div
            key={membre.membre_id}
            onClick={() => navigate(`/membres/${membre.membre_id}`)}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
          >
            {/* En-tête carte */}
            <div className="flex items-center gap-3 mb-4">
              {/* Avatar initiales */}
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-indigo-600">
                  {membre.prenom?.[0]}{membre.nom?.[0]}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {membre.prenom} {membre.nom}
                </h3>
                <BadgeRole role={membre.role} />
              </div>
              {/* Alerte retard */}
              {membre.nb_taches_en_retard > 0 && (
                <span className="ml-auto text-xs text-red-500 font-medium">
                  {membre.nb_taches_en_retard} en retard
                </span>
              )}
            </div>

            {/* Stats tâches */}
            <div className="grid grid-cols-4 gap-2 mb-4 py-3 border-y border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">{membre.nb_taches_total}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{membre.nb_taches_en_cours}</p>
                <p className="text-xs text-gray-400">En cours</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{membre.nb_taches_terminees}</p>
                <p className="text-xs text-gray-400">Terminées</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">{membre.nb_projets_actifs}</p>
                <p className="text-xs text-gray-400">Projets</p>
              </div>
            </div>

            {/* Heures et facturation */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">Heures loggées</p>
                <p className="text-sm font-semibold text-gray-700">
                  {membre.total_heures_enregistrees}h
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Taux horaire moy.</p>
                <p className="text-sm font-semibold text-gray-700">
                  {membre.taux_horaire_moyen
                    ? `${Number(membre.taux_horaire_moyen).toLocaleString('fr-FR')} FCFA`
                    : '—'}
                </p>
              </div>
            </div>

          </div>
        ))}
       {formulaireOuvert && (
      <FormulaireMembre
      onFermer={() => setFormulaireOuvert(false)}
       onSuccess={() => chargerMembres()}
       />
       )}

      </div>
    </div>
  )
}

export default Membres