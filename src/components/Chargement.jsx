// Skeleton card — bloc gris animé qui imite la forme d'une carte
function SkeletonCarte() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-16" />
      </div>
      <div className="grid grid-cols-3 gap-2 my-4 py-3 border-y border-gray-100">
        <div className="h-8 bg-gray-100 rounded" />
        <div className="h-8 bg-gray-100 rounded" />
        <div className="h-8 bg-gray-100 rounded" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  )
}

// Affiche N skeleton cards
function Chargement({ nombre = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: nombre }).map((_, i) => (
        <SkeletonCarte key={i} />
      ))}
    </div>
  )
}

export default Chargement