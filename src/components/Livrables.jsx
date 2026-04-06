// src/components/Livrables.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Chargement from './Chargement'
import FormulaireLivrable from './FormulaireLivrable'

// Badge type livrable
function BadgeType({ type }) {
  const styles = {
    rapport:      'bg-blue-50 text-blue-600',
    dashboard:    'bg-purple-50 text-purple-600',
    modele:       'bg-amber-50 text-amber-600',
    presentation: 'bg-green-50 text-green-600',
    autre:        'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[type] || styles.autre}`}>
      {type}
    </span>
  )
}

// Badge statut liens — lecture seule, calculé par la vue
function BadgeStatutLiens({ statut }) {
  const styles = {
    complet:    'text-green-500',
    partiel:    'text-amber-500',
    aucun_lien: 'text-gray-300',
  }
  const labels = {
    complet:    'Liens complets',
    partiel:    'Liens partiels',
    aucun_lien: 'Aucun lien',
  }
  return (
    <span className={`text-xs font-medium ${styles[statut]}`}>
      {labels[statut]}
    </span>
  )
}

// Une carte livrable
function CarteLivrable({ livrable, onModifier }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">

      {/* En-tête */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-800">{livrable.livrable_nom}</h3>
        <div className="flex items-center gap-2">
          <BadgeType type={livrable.type} />
          <button
            onClick={() => onModifier(livrable)}
            className="text-xs text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
          >
            Modifier
          </button>
        </div>
      </div>

      {/* Phase */}
      {livrable.phase_projet && JSON.parse(JSON.stringify(livrable.phase_projet)).length > 0 && livrable.phase_id && (
        <p className="text-xs text-gray-400 mb-2">
          Phase : {(() => {
            const phases = Array.isArray(livrable.phase_projet)
              ? livrable.phase_projet
              : JSON.parse(livrable.phase_projet || '[]')
            const phase = phases.find(ph => ph.phase_id === livrable.phase_id)
            return phase ? `${phase.Phase_ordre}. ${phase.Phase_nom}` : '—'
          })()}
        </p>
      )}

      {/* Date livraison */}
      {livrable.date_livraison && (
        <p className="text-xs text-gray-400 mb-3">
          Livraison prévue : {livrable.date_livraison}
        </p>
      )}

      {/* Statut liens + boutons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <BadgeStatutLiens statut={livrable.statut_liens} />
        <div className="flex gap-2">
          {livrable.lien_fiche_technique && (
            <button
              onClick={() => window.open(livrable.lien_fiche_technique, '_blank')}
              className="text-xs text-indigo-500 hover:underline"
            >
              Fiche technique
            </button>
          )}
          {livrable.lien_fiche_presentable && (
            <button
              onClick={() => window.open(livrable.lien_fiche_presentable, '_blank')}
              className="text-xs text-indigo-500 hover:underline"
            >
              Présentation
            </button>
          )}
        </div>
      </div>

    </div>
  )
}

function Livrables({ projetId }) {
  const [livrables, setLivrables] = useState([])
  const [chargement, setChargement] = useState(true)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [livrableSelectionne, setLivrableSelectionne] = useState(null)

  async function chargerLivrables() {
    const { data, error } = await supabase
      .from('vue_livrable_projet')
      .select('*')
      .eq('projet_id', projetId)

    if (error) { console.log('Erreur :', error); return }
    setLivrables(data)
    setChargement(false)
  }

  useEffect(() => {
    chargerLivrables()
  }, [projetId])

  function ouvrirCreation() {
    setLivrableSelectionne(null)
    setFormulaireOuvert(true)
  }

  function ouvrirModification(livrable) {
    setLivrableSelectionne(livrable)
    setFormulaireOuvert(true)
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false)
    setLivrableSelectionne(null)
  }

  return (
    <div className="max-w-4xl">

      {chargement && <Chargement nombre={3} />}

      {!chargement && (
        <>
          {/* En-tête */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-400">{livrables.length} livrable(s)</p>
            <button
              onClick={ouvrirCreation}
              className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              + Nouveau livrable
            </button>
          </div>

          {livrables.length === 0 && (
            <p className="text-gray-400 text-sm">Aucun livrable pour ce projet.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {livrables.map(livrable => (
              <CarteLivrable
                key={livrable.livrable_id}
                livrable={livrable}
                onModifier={ouvrirModification}
              />
            ))}
          </div>
        </>
      )}

      {formulaireOuvert && (
        <FormulaireLivrable
          projetId={projetId}
          livrableExistant={livrableSelectionne}
          onFermer={fermerFormulaire}
          onSuccess={chargerLivrables}
        />
      )}

    </div>
  )
}

export default Livrables