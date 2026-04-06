import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function CarteMetrique({ label, valeur, unite, couleur }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${couleur || 'text-gray-800'}`}>
        {typeof valeur === 'number' ? valeur.toLocaleString('fr-FR') : valeur}
        {unite && <span className="text-xs font-normal text-gray-400 ml-1">{unite}</span>}
      </p>
    </div>
  )
}

function BadgeStatutPaiement({ statut }) {
  const styles = {
    payee:      'bg-gray-50 text-gray-600',
    en_attente: 'bg-red-50 text-red-600',
    en_retard:  'bg-red-50 text-red-500',
  }
  const labels = {
    payee:      'Payée',
    en_attente: 'En attente',
    en_retard:  'En retard',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[statut]}`}>
      {labels[statut]}
    </span>
  )
}

function Financier({ projetId }) {
  const [donnees, setDonnees] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function chargerFinancier() {
      const { data, error } = await supabase
        .from('vue_facturation')
        .select('*')
        .eq('projet_id', projetId)
        .single()

      if (error) { console.log('Erreur :', error); return }
      setDonnees(data)
      setChargement(false)
    }
    chargerFinancier()
  }, [projetId])

  if (chargement) return <p className="text-gray-400 text-sm">Chargement...</p>
  if (!donnees)   return <p className="text-gray-400 text-sm">Aucune donnée financière.</p>

  const marge = donnees.montant_facture_forfait - donnees.montant_heures_facturables

  return (
    <div className="max-w-4xl space-y-6">

      {/* Bloc 1 — Facturation client */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Facturation client</h3>
          <BadgeStatutPaiement statut={donnees.statut_paiement} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <CarteMetrique
            label="Montant facturé"
            valeur={donnees.montant_facture_forfait}
            unite="FCFA"
          />
          <CarteMetrique
            label="Date de facturation"
            valeur={donnees.date_facturation ?? 'Non définie'}
          />
          <CarteMetrique
            label="Client"
            valeur={donnees.client_nom}
          />
        </div>
      </div>

      {/* Bloc 2 — Coût interne équipe */}
      {donnees.total_heures_travaillees > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Coût interne équipe</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <CarteMetrique
              label="Heures loggées"
              valeur={donnees.total_heures_travaillees}
              unite="h"
            />
            <CarteMetrique
              label="Coût total équipe"
              valeur={donnees.total_montant_temps_passe}
              unite="FCFA"
            />
            <CarteMetrique
              label="Heures facturables"
              valeur={donnees.montant_heures_facturables}
              unite="FCFA"
            />
          </div>
        </div>
      )}

      {/* Bloc 3 — Indicateurs */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Indicateurs</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <CarteMetrique
            label="Membres ayant loggué"
            valeur={donnees.nb_membres_actifs_saved_time}
            unite="membre(s)"
          />
          <CarteMetrique
            label="Marge"
            valeur={marge}
            unite="FCFA"
            couleur={marge >= 0 ? 'text-green-600' : 'text-red-400'}
          />
          <CarteMetrique
            label="Période projet"
            valeur={`${donnees.date_debut} → ${donnees.date_fin}`}
          />
        </div>
      </div>

    </div>
  )
}

export default Financier