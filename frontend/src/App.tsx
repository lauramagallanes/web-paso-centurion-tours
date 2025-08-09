import React from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { routes } from './utils/routes';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Home from './pages/public/Home'
import About from './pages/public/About'
import Accomodations from './pages/public/Accomodations'
import Activities from './pages/public/Activities'
import Book from './pages/public/Book';
import MyBookings from './pages/public/MyBookings';
import LoginPage from './pages/auth/LoginPage';
// Admin pages
import Dashboard from './pages/admin/Dashboard';
import ReservationManagement from './pages/admin/ReservationManagement';
import RoomManagement from './pages/admin/RoomManagement';
import TrailManagement from './pages/admin/TrailManagement';
import GuideManagement from './pages/admin/GuideManagement';

const App: React.FC = () => {
  return (
    <div>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout/>}>
          <Route index element={<Home/>}/>
          <Route path={routes.about} element={<About/>}/>
          <Route path={routes.accomodations} element={<Accomodations/>}/>
          <Route path={routes.activities} element={<Activities/>}/>
          <Route path={routes.book} element={<Book/>}/>
          <Route path={routes.myBookings} element={
            <ProtectedRoute>
              <MyBookings/>
            </ProtectedRoute>
          }/>
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
      </Routes>
    </div>
  )
}

export default App 