import { useState, useEffect, use } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Chargement from '../components/Chargement'
import FormulaireMembre from '../components/FormulaireMembre'

function BadgeRole({ role }) {
  const labels = {
    data_scientist:        'Data Scientist',
    data_scientist_junior: 'Data Scientist Jr',
    data_analyst:          'Data Analyst',
    data_engineer:         'Data Engineer',
    ml_engineer:           'ML Engineer',
    chef_de_projet:        'Chef de projet',
    stagiaire:             'Stagiaire',
    collaborateur:         'Collaborateur',
  }
  return (
    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
      {labels[role] || role}
    </span>
  )
}

function BadgeStatutTache({ statut }) {
  const styles = {
    a_faire:  'bg-black-100 text-black-500',
    en_cours: 'bg-black-50 text-black-600',
    termine:  'bg-green-50 text-green-600',
    bloque:   'bg-red-50 text-red-500',
  }
  const labels = {
    a_faire:  'À faire',
    en_cours: 'En cours',
    termine:  'Terminé',
    bloque:   'Bloqué',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[statut]}`}>
      {labels[statut]}
    </span>
  )
}

function MembreDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [membre, setMembre] = useState(null)
  const [taches, setTaches] = useState([])
  const [charge, setCharge] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

  
    async function chargerDonnees() {
      // Infos membre via vue_charge_membre
      const { data: dataMembre, error: errMembre } = await supabase
        .from('vue_charge_membre')
        .select('*')
        .eq('membre_id', id)
        .single()

      if (errMembre) { console.log('Erreur membre:', errMembre); return }
      setMembre(dataMembre)

      // Tâches du membre via get_taches_membre
      const { data: dataTaches, error: errTaches } = await supabase
        .rpc('get_taches_membre', { p_membre_id: id })

      if (errTaches) { console.log('Erreur tâches:', errTaches); return }
      setTaches(dataTaches)

      // Charge sur les 30 derniers jours via get_charge_membre
      const dateDebut = new Date()
      dateDebut.setDate(dateDebut.getDate() - 30)
      const { data: dataCharge, error: errCharge } = await supabase
        .rpc('get_charge_membre', {
          p_membre_id:  id,
          p_date_debut: dateDebut.toISOString().split('T')[0],
          p_date_fin:   new Date().toISOString().split('T')[0],
        })

      if (errCharge) { console.log('Erreur charge:', errCharge); return }
      setCharge(dataCharge)
      setChargement(false)
    }
    chargerDonnees()
  useEffect(() => { chargerDonnees() }, [id])


  if (chargement) return <div className="p-8"><Chargement nombre={4} /></div>

  return (
    <div className="max-w-6xl mx-auto">

      {/* Retour */}
      <button
  onClick={() => navigate(-1)}
  className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 hover:border-indigo-300 px-4 py-2 rounded-lg transition-all mb-6"
>
  ← Retour
    </button>

      {/* En-tête membre */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-indigo-600">
              {membre.prenom?.[0]}{membre.nom?.[0]}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {membre.prenom} {membre.nom}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <BadgeRole role={membre.role} />

              <span className="text-xs text-gray-400">depuis {membre.date_entree}</span>
              <button
            onClick={() => setFormulaireOuvert(true)}
            className="ml-auto text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-all"
          >
            Modifier
          </button>
            </div>
          </div>
          {membre.nb_taches_en_retard > 0 && (
            <span className="ml-auto text-xs text-red-500 font-medium bg-black-50 px-3 py-1 rounded-full">
              {membre.nb_taches_en_retard} tâche(s) en retard
            </span>
          )}
        </div>

        {/* Infos contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="text-sm font-medium text-gray-700">{membre.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Taux horaire moyen</p>
            <p className="text-sm font-medium text-gray-700">
              {membre.taux_horaire_moyen
                ? `${Number(membre.taux_horaire_moyen).toLocaleString('fr-FR')} FCFA/h`
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{membre.nb_taches_total}</p>
          <p className="text-xs text-gray-400 mt-1">Tâches total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{membre.nb_taches_en_cours}</p>
          <p className="text-xs text-gray-400 mt-1">En cours</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{membre.total_heures_enregistrees}h</p>
          <p className="text-xs text-gray-400 mt-1">Heures loggées</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{membre.nb_projets_actifs}</p>
          <p className="text-xs text-gray-400 mt-1">Projets actifs</p>
        </div>
      </div>

      {/* Tâches assignées */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Tâches assignées ({taches.length})
        </h2>
        {taches.length === 0 && (
          <p className="text-gray-400 text-sm">Aucune tâche en cours.</p>
        )}
        <div className="space-y-2">
          {taches.map(tache => (
            <div
              key={tache.tache_id}
              onClick={() => navigate(`/projets/${tache.projet_id ?? ''}`)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm hover:border-indigo-200 transition-all cursor-pointer flex justify-between items-center group"
            >
              <div>
                <h3 className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {tache.tache_titre}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{tache.projet_nom}</span>
                  {tache.phase_nom && (
                    <span className="text-xs text-gray-300">· {tache.phase_nom}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {tache.date_echeance && (
                  <span className="text-xs text-gray-400">{tache.date_echeance}</span>
                )}
                <BadgeStatutTache statut={tache.statut} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charge des 30 derniers jours */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Activité récente — 30 derniers jours ({charge.length} entrée(s))
        </h2>
        {charge.length === 0 && (
          <p className="text-gray-400 text-sm">Aucune heure loggée sur cette période.</p>
        )}
        <div className="space-y-2">
          {charge.map((c, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-medium text-gray-700">{c.tache_titre}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.projet_nom}</p>
                {c.description_travail && (
                  <p className="text-xs text-gray-400 mt-1 italic">{c.description_travail}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{c.heures}h</p>
                <p className="text-xs text-gray-400">{c.date_travail}</p>
              </div>
            </div>
          ))}

          {formulaireOuvert && (
         <FormulaireMembre
          membre={membre}
         onFermer={() => setFormulaireOuvert(false)}
         onSuccess={() => chargerDonnees()}
        />
        )}
        </div>
      </div>

    </div>
  )
}

export default MembreDetail