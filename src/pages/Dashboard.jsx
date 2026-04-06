import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Chargement from '../components/Chargement'

function MetriqueCard({ label, valeur, couleur, unite }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${couleur || 'text-gray-800'}`}>
        {typeof valeur === 'number' ? valeur.toLocaleString('fr-FR') : valeur}
        {unite && <span className="text-sm font-normal text-gray-400 ml-1">{unite}</span>}
      </p>
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [projets, setProjets] = useState([])
  const [retards, setRetards] = useState([])
  const [bloques, setBloques] = useState([])
  const [membres, setMembres] = useState([])
  const [livrables, setLivrables] = useState([])
  const [facturation, setFacturation] = useState([])
  const [activite, setActivite] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function chargerDonnees() {

      const { data: dataProjets } = await supabase
        .from('vue_projet_complet')
        .select('*')
        .eq('statut', 'en_cours')
        .order('date_debut', { ascending: false })

      const { data: dataRetards } = await supabase
        .rpc('get_retard_taches')

      const { data: dataBloques } = await supabase
        .from('vue_taches_membres')
        .select('tache_id, titre, projet_id, projet_nom, phase_nom, membres_affectes, date_echeance')
        .eq('statut', 'bloque')
        .order('date_echeance', { ascending: true })

      const { data: dataMembres } = await supabase
        .from('vue_charge_membre')
        .select('*')
        .gt('nb_taches_en_cours', 0)
        .order('nb_taches_en_cours', { ascending: false })

      const today = new Date().toISOString().split('T')[0]
      const in30 = new Date()
      in30.setDate(in30.getDate() + 30)
      const { data: dataLivrables } = await supabase
        .from('vue_livrable_projet')
        .select('*')
        .gte('date_livraison', today)
        .lte('date_livraison', in30.toISOString().split('T')[0])
        .order('date_livraison', { ascending: true })

      const { data: dataFacturation } = await supabase
        .from('vue_facturation')
        .select('*')

      const { data: dataActivite } = await supabase
        .from('vue_taches_membres')
        .select('tache_id, titre, projet_nom, projet_id, commentaires_rattaches, nb_commentaires')
        .gt('nb_commentaires', 0)
        .order('updated_at', { ascending: false })
        .limit(5)

      setProjets(dataProjets || [])
      setRetards(dataRetards || [])
      setBloques(dataBloques || [])
      setMembres(dataMembres || [])
      setLivrables(dataLivrables || [])
      setFacturation(dataFacturation || [])
      setActivite(dataActivite || [])
      setChargement(false)
    }
    chargerDonnees()
  }, [])

  const totalFacturable = facturation.reduce((sum, f) => sum + Number(f.montant_heures_facturables), 0)
  const totalFacture    = facturation.reduce((sum, f) => sum + Number(f.montant_facture_forfait), 0)

  if (chargement) return (
    <div className="max-w-6xl mx-auto p-8">
      <Chargement nombre={4} />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-400 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetriqueCard label="Projets en cours" valeur={projets.length} couleur="text-blue-600" />
        <MetriqueCard label="Tâches en retard" valeur={retards.length} couleur={retards.length > 0 ? 'text-red-500' : 'text-green-600'} />
        <MetriqueCard label="Membres actifs" valeur={membres.length} couleur="text-indigo-600" />
        <MetriqueCard label="Total facturable" valeur={totalFacturable} couleur="text-gray-800" unite="FCFA" />
      </div>

      {retards.length > 0 && (
        <div className="bg-white rounded-xl border border-red-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-red-500 mb-4">
            Tâches en retard ({retards.length})
          </h2>
          <div className="space-y-2">
            {retards.slice(0, 5).map(t => (
              <div
                key={t.tache_id}
                onClick={() => navigate(`/projets/${t.projet_id ?? ''}`)}
                className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.titre}</p>
                  <p className="text-xs text-gray-400">{t.projet_nom} · {t.membre_prenom} {t.membre_nom}</p>
                </div>
                <span className="text-xs font-medium text-red-500 px-2 py-0.5 rounded-full">
                  {t.jours_retard}j
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bloques.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-orange-500 mb-4">
            Tâches bloquées ({bloques.length})
          </h2>
          <div className="space-y-2">
            {bloques.slice(0, 5).map(t => {
              const membresT = Array.isArray(t.membres_affectes)
                ? t.membres_affectes
                : JSON.parse(t.membres_affectes || '[]')
              const premierMembre = membresT[0]
              return (
                <div
                  key={t.tache_id}
                  onClick={() => navigate(`/projets/${t.projet_id ?? ''}`)}
                  className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.titre}</p>
                    <p className="text-xs text-gray-400">
                      {t.projet_nom}
                      {t.phase_nom && ` · ${t.phase_nom}`}
                      {premierMembre && ` · ${premierMembre.prenom} ${premierMembre.nom}`}
                    </p>
                  </div>
                  {t.date_echeance && (
                    <span className="text-xs font-medium text-orange-500 px-2 py-0.5 rounded-full">
                      {t.date_echeance}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Projets en cours ({projets.length})
          </h2>
          {projets.length === 0 && (
            <p className="text-xs text-gray-400">Aucun projet en cours.</p>
          )}
          <div className="space-y-3">
            {projets.map(p => (
              <div
                key={p.projet_id}
                onClick={() => navigate(`/projets/${p.projet_id}`)}
                className="flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {p.projet_nom}
                  </p>
                  <p className="text-xs text-gray-400">{p.client_nom}</p>
                </div>
                <span className="text-xs text-gray-400">{p.date_fin}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Livrables à venir ({livrables.length})
          </h2>
          {livrables.length === 0 && (
            <p className="text-xs text-gray-400">Aucun livrable dans les 30 prochains jours.</p>
          )}
          <div className="space-y-3">
            {livrables.map(l => (
              <div
                key={l.livrable_id}
                onClick={() => navigate(`/projets/${l.projet_id}`)}
                className="flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{l.livrable_nom}</p>
                  <p className="text-xs text-gray-400">{l.projet_nom}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-indigo-600">{l.date_livraison}</p>
                  <p className="text-xs text-gray-400">{l.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Charge équipe ({membres.length} membre(s) actif(s))
        </h2>
        {membres.length === 0 && (
          <p className="text-xs text-gray-400">Aucun membre avec des tâches en cours.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {membres.map(m => {
            const charge = m.nb_taches_en_cours
            const surcharge = charge >= 5
            const moyenne = charge >= 3 && charge < 5
            return (
              <div
                key={m.membre_id}
                onClick={() => navigate(`/membres/${m.membre_id}`)}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-indigo-600">
                    {m.prenom?.[0]}{m.nom?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {m.prenom} {m.nom}
                    </p>
                    <span className={`text-xs font-medium ml-2 flex-shrink-0 ${
                      surcharge ? 'text-red-500' :
                      moyenne   ? 'text-amber-500' :
                                  'text-green-600'
                    }`}>
                      {charge} tâche(s)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        surcharge ? 'bg-red-400' :
                        moyenne   ? 'bg-amber-400' :
                                    'bg-green-400'
                      }`}
                      style={{ width: `${Math.min((charge / 7) * 100, 100)}%` }}
                    />
                  </div>
                  {m.nb_taches_en_retard > 0 && (
                    <p className="text-xs text-red-400 mt-0.5">
                      {m.nb_taches_en_retard} en retard
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Activité récente</h2>
          {activite.length === 0 && (
            <p className="text-xs text-gray-400">Aucune activité récente.</p>
          )}
          <div className="space-y-3">
            {activite.map((t, index) => {
              const commentaires = Array.isArray(t.commentaires_rattaches)
                ? t.commentaires_rattaches
                : JSON.parse(t.commentaires_rattaches || '[]')
              const dernier = commentaires[commentaires.length - 1]
              if (!dernier) return null
              return (
                <div
                  key={`${t.tache_id}-${index}`}
                  onClick={() => navigate(`/projets/${t.projet_id ?? ''}`)}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-medium text-gray-600">
                      {dernier.membre_prenom} {dernier.membre_nom}
                    </p>
                    <p className="text-xs text-gray-400">
                      {dernier.date ? new Date(dernier.date).toLocaleDateString('fr-FR') : ''}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700">{dernier.contenu}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.projet_nom} · {t.titre}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Facturation globale</h2>
          <div className="space-y-3">
            {facturation.map(f => (
              <div
                key={f.projet_id}
                onClick={() => navigate(`/projets/${f.projet_id}`)}
                className="flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{f.projet_nom}</p>
                  <p className="text-xs text-gray-400">{f.client_nom}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700">
                    {Number(f.montant_facture_forfait).toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className={`text-xs font-medium ${
                    f.statut_paiement === 'payee'      ? 'text-green-600' :
                    f.statut_paiement === 'en_retard'  ? 'text-red-500'   : 'text-amber-500'
                  }`}>
                    {f.statut_paiement === 'payee'     ? 'Payé'      :
                     f.statut_paiement === 'en_retard' ? 'En retard' : 'En attente'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <p className="text-xs text-gray-400">Total facturé</p>
            <p className="text-sm font-bold text-gray-800">
              {totalFacture.toLocaleString('fr-FR')} FCFA
            </p>
          </div>
        </div>

      </div>

    </div>
  )
}

export default Dashboard