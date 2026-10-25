import { lazy, Suspense, useEffect, useLayoutEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import CartPill from './components/CartPill'
import Curtain from './components/Curtain'
import Footer from './components/Footer'
import Nav from './components/Nav'
import { useAuth } from './lib/auth'
import { ScrollTrigger, scrollToTop, startSmoothScroll } from './lib/motion'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

// Everything except the home page loads on demand.
const Services = lazy(() => import('./pages/Services'))
const Team = lazy(() => import('./pages/Team'))
const Book = lazy(() => import('./pages/Book'))
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const Login = lazy(() => import('./admin/Login'))
const Dashboard = lazy(() => import('./admin/Dashboard'))
const CalendarView = lazy(() => import('./admin/CalendarView'))
const Appointments = lazy(() => import('./admin/Appointments'))
const Clients = lazy(() => import('./admin/Clients'))
const StaffView = lazy(() => import('./admin/StaffView'))

function PublicLayout() {
  const { pathname } = useLocation()

  useEffect(() => startSmoothScroll(), [])

  useLayoutEffect(() => {
    scrollToTop()
    // Let the new page render before ScrollTrigger measures it.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [pathname])

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-plum focus:px-5 focus:py-3 focus:text-white">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Suspense fallback={<div className="min-h-screen bg-plum" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartPill />
      <Curtain />
    </>
  )
}

function RequireAdmin() {
  const signedIn = useAuth()
  const { pathname } = useLocation()
  if (!signedIn) return <Navigate to="/admin/login" replace state={{ from: pathname }} />
  return <AdminLayout />
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-porcelain" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="team" element={<Team />} />
          <Route path="book" element={<Book />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin/login" element={<Login />} />
        <Route path="admin" element={<RequireAdmin />}>
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="clients" element={<Clients />} />
          <Route path="staff" element={<StaffView />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
