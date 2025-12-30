import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/layout/Navbar.jsx'
import Sidebar from '../components/layout/Sidebar'
import BottomNav from '../components/layout/BottomNav'
import Loader from '../components/common/Loader'

const ProtectedRoute = ({ requiredRole }) => {
  const { user, loading, isAuthenticated, hasRole } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Sidebar />
      
      <main className="pt-16 pb-20 lg:pb-0 lg:pl-64">
        <Outlet />
      </main>
      
      <BottomNav />
    </div>
  )
}

export default ProtectedRoute
