import MainNavbar from '../Components/MainNavbar'
import Footer from '../Components/Footer'
import { Outlet } from 'react-router-dom'
import WhatsAppButton from '../Components/WhatsappButton'

const PublicLayout = () => {
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