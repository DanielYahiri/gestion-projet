import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useMembreActif } from '../context/MembreContext'
import Kanban from '../components/Kanban'
import Phases from '../components/Phases'
import Livrables from '../components/Livrables'
import Financier from '../components/Financier'
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

function Onglet({ label, actif, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        actif
          ? 'border-indigo-600 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
    </button>
  )
}

function ProjetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [projet, setProjet] = useState(null)
  const [ongletActif, setOngletActif] = useState('taches')
  const [afficherFormulaire, setAfficherFormulaire] = useState(false)
  const { membreActif } = useMembreActif()
  const estCollaborateur = membreActif?.role === 'collaborateur'

  async function chargerProjet() {
    const { data, error } = await supabase
      .from('vue_projet_complet')
      .select('*')
      .eq('projet_id', id)
      .single()

    if (error) { console.log('Erreur :', error); return }
    setProjet(data)
  }

  useEffect(() => {
    chargerProjet()
  }, [id])

  if (!projet) return <div className="p-8"><Chargement nombre={3} /></div>

  return (
    <div className="max-w-6xl mx-auto">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 hover:border-indigo-300 px-4 py-2 rounded-lg transition-all mb-6"
      >
        ← Retour
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{projet.projet_nom}</h1>
            <p className="text-sm text-gray-500 mt-1">{projet.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <BadgeStatut statut={projet.statut} />
            {/* Bouton modifier — masqué pour les collaborateurs */}
            {!estCollaborateur && (
              <button
                onClick={() => setAfficherFormulaire(true)}
                className="text-xs text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-all"
              >
                Modifier
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Client</p>
            <p className="text-sm font-medium text-gray-700">{projet.client_nom}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Début</p>
            <p className="text-sm font-medium text-gray-700">{projet.date_debut}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Fin prévue</p>
            <p className="text-sm font-medium text-gray-700">{projet.date_fin}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Type de données</p>
            <p className="text-sm font-medium text-gray-700">{projet.type_donnees}</p>
          </div>
        </div>
      </div>

      {/* Onglets — Financier masqué pour les collaborateurs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <Onglet label="Tâches"    actif={ongletActif === 'taches'}    onClick={() => setOngletActif('taches')} />
        <Onglet label="Phases"    actif={ongletActif === 'phases'}    onClick={() => setOngletActif('phases')} />
        <Onglet label="Livrables" actif={ongletActif === 'livrables'} onClick={() => setOngletActif('livrables')} />
        {!estCollaborateur && (
          <Onglet label="Financier" actif={ongletActif === 'financier'} onClick={() => setOngletActif('financier')} />
        )}
      </div>

      <div>
        {ongletActif === 'taches'    && (
          <Kanban
            projetId={id}
            membreActif={membreActif}
            estCollaborateur={estCollaborateur}
          />
        )}
        {ongletActif === 'phases'    && <Phases projetId={id} />}
        {ongletActif === 'livrables' && <Livrables projetId={id} />}
        {ongletActif === 'financier' && !estCollaborateur && <Financier projetId={id} />}
      </div>

      {afficherFormulaire && (
        <FormulaireProjet
          projetExistant={projet}
          onFermer={() => setAfficherFormulaire(false)}
          onSuccess={() => {
            setProjet(null)
            chargerProjet()
          }}
        />
      )}

    </div>
  )
}

export default ProjetDetail