import { supabase } from '../supabase'
import { useState, useEffect } from 'react'
import { useMembreActif } from '../context/MembreContext'
import FormulaireTache from './FormulaireTache'

// Badge priorité
function BadgePriorite({ priorite }) {
  const styles = {
    haute:   'bg-red-50 text-red-500',
    moyenne: 'bg-amber-50 text-amber-600',
    basse:   'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[priorite]}`}>
      {priorite}
    </span>
  )
}

// Badge statut lecture seule
function BadgeStatut({ statut }) {
  const styles = {
    a_faire:  'bg-gray-100 text-gray-500',
    en_cours: 'bg-blue-50 text-blue-600',
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

// Dropdown statut cliquable
function DropdownStatut({ statut, onChange }) {
  const styles = {
    a_faire:  'bg-gray-100 text-gray-500',
    en_cours: 'bg-blue-50 text-blue-600',
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
    <select
      value={statut}
      onChange={e => onChange(e.target.value)}
      className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 ${styles[statut]}`}
    >
      {Object.entries(labels).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  )
}

// Formulaire logger des heures — accès complet uniquement
function FormulaireTempsPassé({ tacheId, entree = null, onFermer, onSuccess }) {
  const [membres, setMembres] = useState([])
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const [form, setForm] = useState({
    membre_id:           '',
    date:                new Date().toISOString().split('T')[0],
    heures:              '',
    taux_horaire:        '',
    description_travail: '',
    est_facture:         false,
  })

  useEffect(() => {
    async function chargerMembres() {
      const { data } = await supabase
        .from('membre')
        .select('membre_id, nom, prenom')
        .order('nom')
      setMembres(data || [])
    }
    chargerMembres()

    if (entree) {
      setForm({
        membre_id:           entree.membre_id,
        date:                entree.date,
        heures:              entree.heures,
        taux_horaire:        entree.taux_horaire,
        description_travail: entree.description_travail || '',
        est_facture:         entree.est_facture === true,
      })
    }
  }, [])

  function handleChange(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: val })
  }

  async function handleSubmit() {
    if (!form.membre_id)                                      { setErreur('Veuillez sélectionner un membre.'); return }
    if (!form.heures || Number(form.heures) <= 0)             { setErreur("Le nombre d'heures est requis."); return }
    if (!form.taux_horaire || Number(form.taux_horaire) <= 0) { setErreur('Le taux horaire est requis.'); return }
    if (!form.date)                                           { setErreur('La date est requise.'); return }
    setErreur('')
    setEnvoi(true)

    if (entree) {
      const { error } = await supabase
        .from('temps_passe')
        .update({
          membre_id:           form.membre_id,
          date:                form.date,
          heures:              Number(form.heures),
          taux_horaire:        Number(form.taux_horaire),
          description_travail: form.description_travail || null,
          est_facture:         form.est_facture,
        })
        .eq('id', entree.id)

      if (error) {
        console.log('Erreur modification temps:', error)
        setErreur('Une erreur est survenue.')
        setEnvoi(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('temps_passe')
        .insert({
          membre_id:           form.membre_id,
          tache_id:            tacheId,
          date:                form.date,
          heures:              Number(form.heures),
          taux_horaire:        Number(form.taux_horaire),
          description_travail: form.description_travail || null,
          est_facture:         form.est_facture,
        })

      if (error) {
        console.log('Erreur temps passé:', error)
        setErreur('Une erreur est survenue.')
        setEnvoi(false)
        return
      }
    }

    setEnvoi(false)
    onSuccess()
    onFermer()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onFermer} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">

        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {entree ? 'Modifier les heures' : 'Logger des heures'}
          </h2>
          <button onClick={onFermer} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">

          {erreur && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-600">{erreur}</p>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">
              Membre <span className="text-red-400">*</span>
            </label>
            <select
              name="membre_id"
              value={form.membre_id}
              onChange={handleChange}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            >
              <option value="">Sélectionner...</option>
              {membres.map(m => (
                <option key={m.membre_id} value={m.membre_id}>
                  {m.prenom} {m.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">
                Heures <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="heures"
                value={form.heures}
                onChange={handleChange}
                placeholder="Ex: 2.5"
                min="0.5"
                step="0.5"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">
              Taux horaire (FCFA) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="taux_horaire"
              value={form.taux_horaire}
              onChange={handleChange}
              placeholder="Ex: 15000"
              min="0"
              step="500"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Description du travail</label>
            <textarea
              name="description_travail"
              value={form.description_travail}
              onChange={handleChange}
              placeholder="Décrivez le travail effectué..."
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
            <input
              type="checkbox"
              name="est_facture"
              id="est_facture"
              checked={form.est_facture === true}
              onChange={handleChange}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
            <label htmlFor="est_facture" className="text-sm text-gray-700 cursor-pointer">
              Ces heures sont facturables
            </label>
          </div>

        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onFermer}
            className="text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={envoi}
            className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 px-6 py-2 rounded-lg transition-colors font-medium"
          >
            {envoi ? 'Enregistrement...' : entree ? 'Enregistrer' : 'Logger les heures'}
          </button>
        </div>

      </div>
    </div>
  )
}

function PanneauTache({ tacheId, onFermer }) {
  const { membreActif } = useMembreActif()
  const estCollaborateur = membreActif?.role === 'collaborateur'

  const [tache, setTache] = useState(null)
  const [tempsEntrees, setTempsEntrees] = useState([])
  const [chargement, setChargement] = useState(true)
  const [nouveauCommentaire, setNouveauCommentaire] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [formulaireModif, setFormulaireModif] = useState(false)
  const [formulaireTemps, setFormulaireTemps] = useState(false)
  const [entreeModif, setEntreeModif] = useState(null)
  const [majStatut, setMajStatut] = useState(false)

  useEffect(() => {
    if (!tacheId) return

    async function chargerTache() {
      setChargement(true)

      const { data, error } = await supabase
        .from('vue_taches_membres')
        .select('*')
        .eq('tache_id', tacheId)
        .single()

      if (error) { console.log('Erreur :', error); return }
      setTache(data)

      if (!estCollaborateur) {
        const { data: dataTemps } = await supabase
          .from('temps_passe')
          .select('*, membre:membre_id(nom, prenom)')
          .eq('tache_id', tacheId)
          .order('date', { ascending: false })
        setTempsEntrees(dataTemps || [])
      }

      setChargement(false)
    }
    chargerTache()
  }, [tacheId])

  async function rechargerTache() {
    const { data } = await supabase
      .from('vue_taches_membres')
      .select('*')
      .eq('tache_id', tacheId)
      .single()
    if (data) setTache(data)

    if (!estCollaborateur) {
      const { data: dataTemps } = await supabase
        .from('temps_passe')
        .select('*, membre:membre_id(nom, prenom)')
        .eq('tache_id', tacheId)
        .order('date', { ascending: false })
      setTempsEntrees(dataTemps || [])
    }
  }

  const membres = tache
    ? (Array.isArray(tache.membres_affectes)
        ? tache.membres_affectes
        : JSON.parse(tache.membres_affectes || '[]'))
    : []

  const commentaires = tache
    ? (Array.isArray(tache.commentaires_rattaches)
        ? tache.commentaires_rattaches
        : JSON.parse(tache.commentaires_rattaches || '[]'))
    : []

  // Règle universelle — affecté à la tâche = peut modifier et changer le statut
  const estAffecte = membres.some(m => m.membre_id === membreActif?.membre_id)
  // Accès complet non collaborateur peut tout modifier
  const peutModifier = !estCollaborateur ? estAffecte : estAffecte

  async function changerStatut(nouveauStatut) {
    if (majStatut || !estAffecte) return
    setMajStatut(true)

    const { error } = await supabase
      .from('tache')
      .update({ statut: nouveauStatut })
      .eq('tache_id', tacheId)

    if (error) { console.log('Erreur statut:', error); setMajStatut(false); return }

    setTache(prev => ({ ...prev, statut: nouveauStatut }))
    setMajStatut(false)
  }

  async function envoyerCommentaire() {
    if (!nouveauCommentaire.trim() || !membreActif) return
    setEnvoi(true)

    const { error } = await supabase
      .from('commentaire')
      .insert({
        contenu:   nouveauCommentaire,
        date:      new Date().toISOString(),
        membre_id: membreActif.membre_id,
        tache_id:  tacheId,
      })

    if (error) { console.log('Erreur commentaire:', error); setEnvoi(false); return }

    setNouveauCommentaire('')
    setEnvoi(false)
    rechargerTache()
  }

  return (
    <div className="fixed inset-0 z-20 flex justify-end">

      <div className="flex-1 bg-black bg-opacity-30" onClick={onFermer} />

      <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl">

        {chargement ? (
          <p className="text-gray-400 text-sm p-6">Chargement...</p>
        ) : (
          <>
            {/* En-tête */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold text-gray-900 pr-4">{tache.titre}</h2>
                <div className="flex items-center gap-2">
                  {peutModifier && (
                    <button
                      onClick={() => setFormulaireModif(true)}
                      className="text-xs text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-2 py-1 rounded-lg transition-all"
                    >
                      Modifier
                    </button>
                  )}
                  <button
                    onClick={onFermer}
                    className="text-gray-400 hover:text-gray-600 text-xl font-light"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Statut — dropdown si affecté, badge lecture seule sinon */}
              <div className="flex gap-2 flex-wrap items-center">
                {estAffecte ? (
                  <>
                    <DropdownStatut statut={tache.statut} onChange={changerStatut} />
                    {majStatut && (
                      <span className="text-xs text-gray-400 italic">Mise à jour...</span>
                    )}
                  </>
                ) : (
                  <BadgeStatut statut={tache.statut} />
                )}
                <BadgePriorite priorite={tache.priorite} />
                {tache.est_en_retard && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                    En retard
                  </span>
                )}
              </div>
            </div>

            {/* Corps */}
            <div className="p-6 space-y-6">

              {/* Infos générales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Projet</p>
                  <p className="text-sm font-medium text-gray-700">{tache.projet_nom}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Phase</p>
                  <p className="text-sm font-medium text-gray-700">{tache.phase_nom ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Début</p>
                  <p className="text-sm font-medium text-gray-700">{tache.date_debut ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Échéance</p>
                  <p className="text-sm font-medium text-gray-700">{tache.date_echeance ?? '—'}</p>
                </div>
              </div>

              {/* Description */}
              {tache.description && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Description</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{tache.description}</p>
                </div>
              )}

              {/* Membres affectés */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Membres affectés</p>
                {membres.length === 0 && (
                  <p className="text-sm text-gray-400">Aucun membre assigné</p>
                )}
                <div className="space-y-2">
                  {membres.map(m => (
                    <div key={m.membre_id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-indigo-600">
                          {m.prenom?.[0]}{m.nom?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{m.prenom} {m.nom}</p>
                        <p className="text-xs text-gray-400">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heures loggées — accès complet uniquement */}
              {!estCollaborateur && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-xs text-gray-400">Heures loggées</p>
                    <button
                      onClick={() => { setEntreeModif(null); setFormulaireTemps(true) }}
                      className="text-xs text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
                    >
                      + Logger des heures
                    </button>
                  </div>

                  {tache.total_heures > 0 ? (
                    <p className="text-lg font-bold text-gray-800 mb-3">
                      {tache.total_heures}h
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        — {tache.montant_facturable.toLocaleString('fr-FR')} FCFA facturables
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 mb-3">Aucune heure loggée</p>
                  )}

                  {tempsEntrees.length > 0 && (
                    <div className="space-y-2 border-t border-gray-200 pt-2">
                      {tempsEntrees.map(t => (
                        <div key={t.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2">
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              {t.membre?.prenom} {t.membre?.nom}
                            </p>
                            <p className="text-xs text-gray-400">
                              {t.date} · {t.est_facture === true ? 'Facturable' : 'Non facturable'}
                            </p>
                            {t.description_travail && (
                              <p className="text-xs text-gray-400 italic mt-0.5">{t.description_travail}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-800">{t.heures}h</p>
                              <p className="text-xs text-gray-400">
                                {Number(t.montant_calcule).toLocaleString('fr-FR')} FCFA
                              </p>
                            </div>
                            <button
                              onClick={() => { setEntreeModif(t); setFormulaireTemps(true) }}
                              className="text-xs text-gray-400 hover:text-indigo-500 border border-gray-200 hover:border-indigo-300 px-2 py-1 rounded-lg transition-all"
                            >
                              Modifier
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Commentaires */}
              <div>
                <p className="text-xs text-gray-400 mb-3">
                  Commentaires ({commentaires.length})
                </p>
                {commentaires.length === 0 && (
                  <p className="text-sm text-gray-400">Aucun commentaire</p>
                )}
                <div className="space-y-3">
                  {commentaires.map((c, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {c.membre_prenom} {c.membre_nom}
                        </span>
                        <span className="text-xs text-gray-400">
                          {c.date ? new Date(c.date).toLocaleDateString('fr-FR') : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{c.contenu}</p>
                    </div>
                  ))}
                </div>

                {/* Formulaire commentaire — membreActif automatique */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-indigo-600">
                        {membreActif?.prenom?.[0]}{membreActif?.nom?.[0]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Commenter en tant que <span className="font-medium text-gray-600">{membreActif?.prenom} {membreActif?.nom}</span>
                    </p>
                  </div>

                  <textarea
                    value={nouveauCommentaire}
                    onChange={e => setNouveauCommentaire(e.target.value)}
                    placeholder="Écrire un commentaire..."
                    rows={3}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-2 text-gray-700 focus:outline-none focus:border-indigo-400 resize-none"
                  />

                  <button
                    onClick={envoyerCommentaire}
                    disabled={!nouveauCommentaire.trim() || envoi}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {envoi ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </div>

            </div>
          </>
        )}

        {/* Formulaire modification tâche */}
        {formulaireModif && peutModifier && (
          <FormulaireTache
            tache={tache}
            projetId={tache.projet_id}
            onFermer={() => setFormulaireModif(false)}
            onSuccess={rechargerTache}
          />
        )}

        {/* Formulaire temps passé — accès complet uniquement */}
        {formulaireTemps && !estCollaborateur && (
          <FormulaireTempsPassé
            tacheId={tacheId}
            entree={entreeModif}
            onFermer={() => { setFormulaireTemps(false); setEntreeModif(null) }}
            onSuccess={rechargerTache}
          />
        )}

      </div>
    </div>
  )
}

export default PanneauTache