import React from 'react';
import MainNavbar from '../common/MainNavbar'
import Footer from '../common/Footer'
import { Outlet } from 'react-router-dom'
import WhatsAppButton from '../common/WhatsappButton'

const PublicLayout: React.FC = () => {
  return (
    <div>
      <MainNavbar/>
      <Outlet/>
      <WhatsAppButton/>
      <Footer/>
    </div>
  )
}

export default PublicLayout 