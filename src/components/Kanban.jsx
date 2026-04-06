import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import PanneauTache from './PanneauTache'
import FormulaireTache from './FormulaireTache'

function BadgePriorite({ priorite }) {
  const styles = {
    haute:   'text-red-500',
    moyenne: 'text-amber-500',
    basse:   'text-gray-400',
  }
  return (
    <span className={`text-xs font-medium ${styles[priorite]}`}>
      {priorite}
    </span>
  )
}

function CarteTache({ tache, onClick, membreActif }) {
  const estCollaborateur = membreActif?.role === 'collaborateur'

  const membres = Array.isArray(tache.membres_affectes)
    ? tache.membres_affectes
    : JSON.parse(tache.membres_affectes || '[]')

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-3 mb-2 hover:shadow-sm transition-shadow cursor-pointer"
    >
      {tache.est_en_retard && (
        <span className="text-xs text-red-500 font-medium mb-1 block">En retard</span>
      )}
      <p className="text-sm font-medium text-gray-800 mb-2">{tache.titre}</p>
      {tache.phase_nom && (
        <p className="text-xs text-indigo-400 mb-2">{tache.phase_nom}</p>
      )}
      <div className="flex justify-between items-center">
        <BadgePriorite priorite={tache.priorite} />
        {tache.date_echeance && (
          <span className="text-xs text-gray-400">{tache.date_echeance}</span>
        )}
      </div>
      {membres.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 flex-wrap">
          {membres.map(m => (
            <div key={m.membre_id} className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs text-indigo-600 font-medium">
                  {m.prenom?.[0]}{m.nom?.[0]}
                </span>
              </div>
              <span className="text-xs text-gray-500">{m.prenom} {m.nom}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex gap-3">
        {/* Heures masquées pour les collaborateurs */}
        {tache.total_heures > 0 && !estCollaborateur && (
          <span className="text-xs text-gray-400">{tache.total_heures}h loggées</span>
        )}
        {tache.nb_commentaires > 0 && (
          <span className="text-xs text-gray-400">{tache.nb_commentaires} commentaire(s)</span>
        )}
      </div>
    </div>
  )
}

function Colonne({ titre, couleur, taches, onSelectTache, onNouveauTache, membreActif }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${couleur}`} />
        <span className="text-sm font-medium text-gray-700">{titre}</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
          {taches.length}
        </span>
      </div>
      <div className="bg-gray-50 rounded-xl p-2 min-h-32">
        {taches.length === 0 && (
          <p className="text-xs text-gray-300 text-center mt-4">Aucune tâche</p>
        )}
        {taches.map(tache => (
          <CarteTache
            key={tache.tache_id}
            tache={tache}
            membreActif={membreActif}
            onClick={() => onSelectTache(tache.tache_id)}
          />
        ))}
        <button
          onClick={onNouveauTache}
          className="w-full mt-2 text-xs text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 py-1.5 rounded-lg transition-colors"
        >
          + Tâche
        </button>
      </div>
    </div>
  )
}

function Kanban({ projetId, membreActif }) {
  const [taches, setTaches] = useState([])
  const [tacheSelectionnee, setTacheSelectionnee] = useState(null)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)

  async function chargerTaches() {
    const { data, error } = await supabase
      .from('vue_taches_membres')
      .select('*')
      .eq('projet_id', projetId)
    if (error) { console.log('Erreur :', error); return }
    setTaches(data)
  }

  useEffect(() => { chargerTaches() }, [projetId])

  const parStatut = (statut) => taches.filter(t => t.statut === statut)

  return (
    <div>
      <div className="flex gap-4">
        <Colonne titre="À faire"  couleur="bg-gray-400"  taches={parStatut('a_faire')}  onSelectTache={setTacheSelectionnee} onNouveauTache={() => setFormulaireOuvert(true)} membreActif={membreActif} />
        <Colonne titre="En cours" couleur="bg-blue-400"  taches={parStatut('en_cours')} onSelectTache={setTacheSelectionnee} onNouveauTache={() => setFormulaireOuvert(true)} membreActif={membreActif} />
        <Colonne titre="Terminé"  couleur="bg-green-400" taches={parStatut('termine')}  onSelectTache={setTacheSelectionnee} onNouveauTache={() => setFormulaireOuvert(true)} membreActif={membreActif} />
        <Colonne titre="Bloqué"   couleur="bg-red-400"   taches={parStatut('bloque')}   onSelectTache={setTacheSelectionnee} onNouveauTache={() => setFormulaireOuvert(true)} membreActif={membreActif} />
      </div>

      {formulaireOuvert && (
        <FormulaireTache
          projetId={projetId}
          membreActif={membreActif}
          onFermer={() => setFormulaireOuvert(false)}
          onSuccess={() => chargerTaches()}
        />
      )}

      {tacheSelectionnee && (
        <PanneauTache
          tacheId={tacheSelectionnee}
          membreActif={membreActif}
          onFermer={() => setTacheSelectionnee(null)}
        />
      )}
    </div>
  )
}

export default Kanban