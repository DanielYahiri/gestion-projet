import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import FormulairePhase from './FormulairePhase'
import Chargement from './Chargement'

function CartePhase({ phase, taches, onModifier }) {
  const tachesPhase = taches.filter(t => t.phase_id === phase.phase_id)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">

      {/* En-tête phase */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center">
          <span className="text-xs font-bold text-indigo-600">{phase.ordre}</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{phase.nom}</h3>
          {phase.description && (
            <p className="text-xs text-gray-400">{phase.description}</p>
          )}
        </div>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {tachesPhase.length} tâche(s)
        </span>
        <button
          onClick={() => onModifier(phase)}
          className="text-xs text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
        >
          Modifier
        </button>
      </div>

      {/* Tâches de la phase */}
      {tachesPhase.length === 0 && (
        <p className="text-xs text-gray-300 ml-10">Aucune tâche</p>
      )}

      <div className="space-y-2 ml-10">
        {tachesPhase.map(tache => {
          const membres = Array.isArray(tache.membres_affectes)
            ? tache.membres_affectes
            : JSON.parse(tache.membres_affectes || '[]')

          return (
            <div
              key={tache.tache_id}
              className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {tache.est_en_retard && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                )}
                <span className="text-sm text-gray-700">{tache.titre}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{tache.priorite}</span>
                <span className="text-xs text-gray-400">{tache.date_echeance}</span>

                <div className="flex -space-x-1">
                  {membres.map(m => (
                    <div
                      key={m.membre_id}
                      className="w-5 h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center"
                      title={`${m.prenom} ${m.nom}`}
                    >
                      <span className="text-xs text-indigo-600 font-medium">
                        {m.prenom?.[0]}{m.nom?.[0]}
                      </span>
                    </div>
                  ))}
                </div>

                {tache.nb_commentaires > 0 && (
                  <span className="text-xs text-gray-400">
                    {tache.nb_commentaires}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

function Phases({ projetId }) {
  const [phases, setPhases] = useState([])
  const [taches, setTaches] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [phaseSelectionnee, setPhaseSelectionnee] = useState(null)

  async function chargerDonnees() {
    const { data: dataPhases, error: errPhases } = await supabase
      .from('phase')
      .select('*')
      .eq('projet_id', projetId)
      .order('ordre', { ascending: true })

    if (errPhases) { console.log('Erreur phases:', errPhases); return }

    const { data: dataTaches, error: errTaches } = await supabase
      .from('vue_taches_membres')
      .select('*')
      .eq('projet_id', projetId)

    if (errTaches) { console.log('Erreur tâches:', errTaches); return }

    setPhases(dataPhases)
    setTaches(dataTaches)
    setChargement(false)
  }

  useEffect(() => {
    chargerDonnees()
  }, [projetId])

  function ouvrirCreation() {
    setPhaseSelectionnee(null)
    setFormulaireOuvert(true)
  }

  function ouvrirModification(phase) {
    setPhaseSelectionnee(phase)
    setFormulaireOuvert(true)
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false)
    setPhaseSelectionnee(null)
  }

  return (
    <div className="max-w-4xl">

      {chargement && <Chargement nombre={3} />}

      {!chargement && (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-400">{phases.length} phase(s)</p>
            <button
              onClick={ouvrirCreation}
              className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              + Nouvelle phase
            </button>
          </div>

          {phases.length === 0 && (
            <p className="text-gray-400 text-sm">Aucune phase pour ce projet.</p>
          )}
          {phases.map(phase => (
            <CartePhase
              key={phase.phase_id}
              phase={phase}
              taches={taches}
              onModifier={ouvrirModification}
            />
          ))}
        </>
      )}

      {formulaireOuvert && (
        <FormulairePhase
          projetId={projetId}
          phaseExistante={phaseSelectionnee}
          onFermer={fermerFormulaire}
          onSuccess={chargerDonnees}
        />
      )}

    </div>
  )
}

export default Phases