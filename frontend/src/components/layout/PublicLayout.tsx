import React from 'react';
import { useLocation } from 'react-router-dom';
import MainNavbar from '../common/MainNavbar'
import Footer from '../common/Footer'
import Breadcrumbs from '../common/Breadcrumbs'
import { Outlet } from 'react-router-dom'
import WhatsAppButton from '../common/WhatsappButton'

const PublicLayout: React.FC = () => {
  const location = useLocation();
  
  // Don't show breadcrumbs on home page and demo pages
  const hideBreadcrumbs = location.pathname === '/' || 
                         location.pathname.includes('-demo') ||
                         location.pathname === '/login';

  return (
    <div>
      <MainNavbar/>
      {!hideBreadcrumbs && (
        <div className="breadcrumbs-container">
          <div className="container">
            <Breadcrumbs />
          </div>
        </div>
      )}
      <Outlet/>
      <WhatsAppButton/>
      <Footer/>
    </div>
  )
}

export default PublicLayout 