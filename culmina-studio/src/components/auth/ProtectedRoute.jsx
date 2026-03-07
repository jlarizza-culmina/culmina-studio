import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', background:'#1A1810', color:'#C9924A',
      fontFamily:'Cormorant Garamond, serif', fontSize:'1.5rem' }}>
      Culmina
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}
