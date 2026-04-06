import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useMembreActif } from '../context/MembreContext'
import Chargement from '../components/Chargement'
import FormulaireProjet from '../components/FormulaireProjet'

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

function BarreProgression({ pourcentage }) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Avancement</span>
        <span>{pourcentage ?? 0}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all"
          style={{ width: `${pourcentage ?? 0}%` }}
        />
      </div>
    </div>
  )
}

function Projets() {
  const [projets, setProjets] = useState([])
  const [avancements, setAvancements] = useState({})
  const [chargement, setChargement] = useState(true)
  const [afficherFormulaire, setAfficherFormulaire] = useState(false)
  const navigate = useNavigate()
  const { membreActif } = useMembreActif()
  const estCollaborateur = membreActif?.role === 'collaborateur'

  async function chargerDonnees() {
    setChargement(true)

    let query = supabase.from('vue_projet_complet').select('*')

    // ← Si collaborateur, ne charger que ses projets
    if (estCollaborateur) {
      query = query.eq('membre_id', membreActif.membre_id)
    }

    const { data: dataProjets, error } = await query

    if (error) { console.log('Erreur :', error); return }
    setProjets(dataProjets)

    const resultats = {}
    await Promise.all(
      dataProjets.map(async (projet) => {
        const { data } = await supabase
          .rpc('get_avancement_projet', { p_projet_id: projet.projet_id })
        if (data && data[0]) {
          resultats[projet.projet_id] = projet.statut === 'terminé'
            ? 100
            : data[0].pourcentage ?? 0
        }
      })
    )
    setAvancements(resultats)
    setChargement(false)
  }

  useEffect(() => {
    if (membreActif) chargerDonnees()
  }, [membreActif])

  return (
    <div className="max-w-6xl mx-auto">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
          <p className="text-sm text-gray-400 mt-1">{projets.length} projet(s) au total</p>
        </div>
        {/* Bouton visible uniquement pour les admins */}
        {!estCollaborateur && (
          <button
            onClick={() => setAfficherFormulaire(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Nouveau projet
          </button>
        )}
      </div>

      {chargement && <Chargement nombre={3} />}

      {!chargement && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projets.map(projet => (
            <div
              key={projet.projet_id}
              onClick={() => navigate(`/projets/${projet.projet_id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {projet.projet_nom}
                </h3>
                <BadgeStatut statut={projet.statut} />
              </div>

              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-gray-400">Client</span>
                <span className="text-xs font-medium text-gray-600">{projet.client_nom}</span>
              </div>

              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-gray-400">Secteur</span>
                <span className="text-xs font-medium text-gray-600">{projet.secteur_activite}</span>
              </div>

              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">{projet.date_debut}</span>
                <span className="text-xs text-gray-300">→</span>
                <span className="text-xs text-gray-400">{projet.date_fin}</span>
              </div>

              <BarreProgression pourcentage={avancements[projet.projet_id]} />
            </div>
          ))}
        </div>
      )}

      {afficherFormulaire && (
        <FormulaireProjet
          onFermer={() => setAfficherFormulaire(false)}
          onSuccess={chargerDonnees}
        />
      )}

    </div>
  )
}

export default Projets