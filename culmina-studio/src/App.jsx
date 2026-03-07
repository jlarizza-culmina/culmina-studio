import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/ui/AppShell'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Manuscript from './pages/Manuscript'
import Assets from './pages/Assets'
import Development from './pages/Development'
import Production from './pages/Production'
import Post from './pages/Post'
import Distribution from './pages/Distribution'
import Finances from './pages/Finances'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import SevenStages from './pages/SevenStages'
import SeriesManager from './pages/SeriesManager'
import Lighting from './pages/Lighting'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/lighting" element={<Lighting />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="manuscript" element={<Manuscript />} />
        <Route path="assets" element={<Assets />} />
        <Route path="development" element={<Development />} />
        <Route path="production" element={<Production />} />
        <Route path="post" element={<Post />} />
        <Route path="distribution" element={<Distribution />} />
        <Route path="finances" element={<Finances />} />
        <Route path="admin" element={<Admin />} />
        <Route path="profile" element={<Profile />} />
        <Route path="7stages" element={<SevenStages />} />
        <Route path="series" element={<SeriesManager />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
