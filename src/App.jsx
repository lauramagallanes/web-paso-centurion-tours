
import { Route, Routes } from 'react-router-dom';
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { routes } from './utils/routes';
import PublicLayout from './Layout/PublicLayout';
import Home from './Pages/Home'
import About from './Pages/About'
import Accomodations from './Pages/Accomodations'
import Activities from './Pages/Activities'
import Book from './Pages/Book';
import MyBookings from './Pages/MyBookings';


function App() {
  
  return (
    
      <div>
        <Routes>
          <Route path={routes.home} element={<PublicLayout/>}>
            <Route path={routes.home} element={<Home/>}/>
            <Route path={routes.about} element={<About/>}/>
            <Route path={routes.accomodations} element={<Accomodations/>}/>
            <Route path={routes.activities} element={<Activities/>}/>
            <Route path={routes.book} element={<Book/>}/>
            <Route path={routes.myBookings} element={<MyBookings/>}/>
          </Route>
        </Routes>
      </div>
     
    
  )
}

export default App
