import React from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { routes } from './utils/routes';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import ShoppingCart from './components/common/ShoppingCart';
import Home from './pages/public/Home'
import Birding from './pages/public/Birding'
import About from './pages/public/About'
import Accommodations from './pages/public/Accommodations'
import RoomDetails from './pages/public/RoomDetails'
import Activities from './pages/public/Activities'
import ActivityDetails from './pages/public/ActivityDetails'
import Book from './pages/public/Book';
import MyBookings from './pages/public/MyBookings';
import Favorites from './pages/public/Favorites';
import Checkout from './pages/public/Checkout';
import PaymentResult from './pages/public/PaymentResult';
import PaymentCancelled from './pages/public/PaymentCancelled';
import CalendarDemo from './pages/public/CalendarDemo';
import LogoDemo from './pages/public/LogoDemo';
import IconDemo from './pages/public/IconDemo';
import IllustrationDemo from './pages/public/IllustrationDemo';
import PhotoGalleryDemo from './pages/public/PhotoGalleryDemo';
import LoginPage from './pages/auth/LoginPage';
import NotFound from './pages/error/NotFound';
import ServerError from './pages/error/ServerError';
import ErrorBoundary from './components/common/ErrorBoundary';
import ErrorDemo from './pages/public/ErrorDemo';
import BreadcrumbsDemo from './pages/public/BreadcrumbsDemo';
// Admin pages
import Dashboard from './pages/admin/Dashboard';
import ReservationManagement from './pages/admin/ReservationManagement';
import RoomManagement from './pages/admin/RoomManagement';
import TrailManagement from './pages/admin/TrailManagement';
import GuideManagement from './pages/admin/GuideManagement';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <div>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout/>}>
            <Route index element={<Home/>}/>
            <Route path={routes.about} element={<About/>}/>
            <Route path={routes.birdwatching} element={<Birding/>}/>
            <Route path={routes.alojamientos} element={<Accommodations/>}/>
            <Route path="/alojamientos/:id" element={<RoomDetails/>}/>
            <Route path="/habitaciones/:id" element={<RoomDetails/>}/>
            <Route path={routes.activities} element={<Activities/>}/>
            <Route path="/actividades/:id" element={<ActivityDetails/>}/>
            <Route path={routes.book} element={<Book/>}/>
            <Route path={routes.checkout} element={<Checkout/>}/>
            <Route path={routes.paymentResult} element={<PaymentResult/>}/>
            <Route path={routes.paymentCancelled} element={<PaymentCancelled/>}/>
            <Route path={routes.myBookings} element={
              <ProtectedRoute>
                <MyBookings/>
              </ProtectedRoute>
            }/>
            <Route path="/favoritos" element={<Favorites/>}/>
            <Route path="/calendario-demo" element={<CalendarDemo/>}/>
            <Route path="/logo-demo" element={<LogoDemo/>}/>
            <Route path="/iconos-demo" element={<IconDemo/>}/>
            <Route path="/ilustraciones-demo" element={<IllustrationDemo/>}/>
            <Route path="/galeria-demo" element={<PhotoGalleryDemo/>}/>
            <Route path="/error-demo" element={<ErrorDemo/>}/>
            <Route path="/breadcrumbs-demo" element={<BreadcrumbsDemo/>}/>
            <Route path="/error-500" element={<ServerError/>}/>
          </Route>

          {/* Login Route */}
          <Route path={routes.login} element={<LoginPage/>}/>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout/>
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard/>}/>
            <Route path="reservations" element={<ReservationManagement/>}/>
            <Route path="rooms" element={<RoomManagement/>}/>
            <Route path="trails" element={<TrailManagement/>}/>
            <Route path="guides" element={<GuideManagement/>}/>
          </Route>

          {/* 404 - Must be last */}
          <Route path="*" element={<NotFound/>}/>
        </Routes>
        <ShoppingCart />
      </div>
    </ErrorBoundary>
  )
}

export default App 