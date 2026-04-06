import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { useMembreActif } from './context/MembreContext'
import Projets from './pages/Projets'
import Clients from './pages/Clients'
import Membres from './pages/Membres'
import ProjetDetail from './pages/ProjetDetail'
import ClientDetail from './pages/ClientDetail'
import MembreDetail from './pages/MembreDetail'
import Dashboard from './pages/Dashboard'
import PageConnexion from './pages/PageConnexion'
import PageNouveauMotDePasse from './pages/PageNouveauMotDePasse'
import Chargement from './components/Chargement'

function NavLink({ to, children }) {
  const location = useLocation()
  const actif = location.pathname === to
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        actif
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  )
}

function RouteProtegee({ children, adminSeulement = false }) {
  const { membreActif, chargementAuth } = useMembreActif()

  if (chargementAuth) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Chargement nombre={3} />
    </div>
  )

  if (!membreActif) return <Navigate to="/connexion" replace />

  if (adminSeulement && membreActif.role === 'collaborateur') {
    return <Navigate to="/projets" replace />
  }

  return children
}

function App() {
  const { membreActif, chargementAuth, deconnexion } = useMembreActif()
  const estCollaborateur = membreActif?.role === 'collaborateur'

  if (chargementAuth) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Chargement nombre={3} />
    </div>
  )

  return (
    <BrowserRouter>
      {membreActif && (
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 sticky top-0 z-10">
          <div className="flex items-center gap-2 mr-6">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <span className="font-bold text-gray-800 text-base">DataFlow</span>
          </div>

          {!estCollaborateur && <NavLink to="/">Dashboard</NavLink>}
          <NavLink to="/projets">Projets</NavLink>
          {!estCollaborateur && <NavLink to="/clients">Clients</NavLink>}
          {!estCollaborateur && <NavLink to="/membres">Membres</NavLink>}

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs font-medium text-indigo-600">
                  {membreActif.prenom?.[0]}{membreActif.nom?.[0]}
                </span>
              </div>
              <span className="text-sm text-gray-600 hidden md:block">
                {membreActif.prenom} {membreActif.nom}
              </span>
            </div>
            <button
              onClick={deconnexion}
              className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </nav>
      )}

      <main className="bg-gray-50 min-h-screen p-8">
        <Routes>
          <Route path="/connexion" element={
            membreActif ? <Navigate to="/projets" replace /> : <PageConnexion />
          } />
          <Route path="/nouveau-mot-de-passe" element={<PageNouveauMotDePasse />} />

          <Route path="/" element={
            <RouteProtegee adminSeulement={true}>
              <Dashboard />
            </RouteProtegee>
          } />

          <Route path="/projets" element={
            <RouteProtegee>
              <Projets />
            </RouteProtegee>
          } />
          <Route path="/projets/:id" element={
            <RouteProtegee>
              <ProjetDetail />
            </RouteProtegee>
          } />

          <Route path="/clients" element={
            <RouteProtegee adminSeulement={true}>
              <Clients />
            </RouteProtegee>
          } />
          <Route path="/clients/:id" element={
            <RouteProtegee adminSeulement={true}>
              <ClientDetail />
            </RouteProtegee>
          } />

          <Route path="/membres" element={
            <RouteProtegee adminSeulement={true}>
              <Membres />
            </RouteProtegee>
          } />
          <Route path="/membres/:id" element={
            <RouteProtegee adminSeulement={true}>
              <MembreDetail />
            </RouteProtegee>
          } />

          <Route path="*" element={<Navigate to="/projets" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App