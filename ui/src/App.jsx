import {useState, useEffect} from 'react'
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import './App.css'
import Header from './components/Header';
import CustomUpload from './components/CustomUpload';
import Home from './components/Home';
import Signup from './components/Signup';
import Login from './components/Login';
import { auth } from './firebase'
import { AuthProvider } from './AuthContext';
import {onAuthStateChanged} from 'firebase/auth'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Header />}>
      <Route path="/signup" element={<Signup/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route index element={<Home />} />
      <Route path="custom" element={<CustomUpload />} />
    </Route>
  )
)

function App({routes}) {
  const [currentUser, setCurrentUser] = useState(null)
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
     })
  }, [])
  return(
    <>
    <AuthProvider value={{currentUser}}>
    <RouterProvider router={router}/>  
    </AuthProvider>
    
    </>
  )

  
}

export default App
