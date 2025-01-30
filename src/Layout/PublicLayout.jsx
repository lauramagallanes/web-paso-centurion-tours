import MainNavbar from '../Components/MainNavbar'
import Footer from '../Components/Footer'
import { Outlet } from 'react-router-dom'

const PublicLayout = () => {
  return (
    <div>
      <MainNavbar/>
      <Outlet/>
      <Footer/>
    </div>
  )
}

export default PublicLayout