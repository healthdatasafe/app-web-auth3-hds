import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Authorization from './pages/Authorization'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import ChangePassword from './pages/ChangePassword'
import SignInHub from './pages/SignInHub'
import NotFound from './pages/NotFound'

function AppLayout () {
  const { initialized } = useAuth()

  if (!initialized) {
    return (
      <div className='flex flex-1 items-center justify-center text-sm text-[var(--hds-muted-foreground)]'>
        Loading…
      </div>
    )
  }

  return (
    <div className='flex flex-1 flex-col items-center justify-center px-4 py-6 sm:py-10'>
      {/* w-full lets per-page containers (with their own max-w-*) stretch to
          fill the parent's content area before clamping; without it the
          flex column's items-center collapses each route's outer div to its
          intrinsic content width. */}
      <div className='w-full'>
        <QueryParamGuard />
      </div>
    </div>
  )
}

/** Persist query params when navigating between routes (mirrors old Vue router.beforeEach) */
function QueryParamGuard () {
  const location = useLocation()
  const navigate = useNavigate()
  const [prevSearch, setPrevSearch] = useState(location.search)

  useEffect(() => {
    // If navigating to a route with no query params but we had some, re-add them
    if (!location.search && prevSearch) {
      navigate(location.pathname + prevSearch, { replace: true })
    } else {
      setPrevSearch(location.search)
    }
  }, [location.pathname, location.search, prevSearch, navigate])

  return (
    <Routes>
      <Route path='/access/auth' element={<Authorization />} />
      <Route path='/access/register' element={<Register />} />
      <Route path='/access/reset-password' element={<ResetPassword />} />
      <Route path='/access/change-password' element={<ChangePassword />} />
      <Route path='/access/signin' element={<SignInHub />} />
      {/* Legacy aliases */}
      <Route path='/access/access.html' element={<Navigate to='/access/auth' replace />} />
      <Route path='/access/register.html' element={<Navigate to='/access/register' replace />} />
      <Route path='/access/reset-password.html' element={<Navigate to='/access/reset-password' replace />} />
      <Route path='/access/signinhub.html' element={<Navigate to='/access/signin' replace />} />
      <Route path='/access/change-password.html' element={<Navigate to='/access/change-password' replace />} />
      <Route path='/access' element={<Navigate to='/access/auth' replace />} />
      <Route path='/access/' element={<Navigate to='/access/auth' replace />} />
      <Route path='/' element={<Navigate to='/access/auth' replace />} />
      <Route path='*' element={<NotFound />} />
    </Routes>
  )
}

export default function App () {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}
