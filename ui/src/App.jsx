import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import './App.css'
import Header from './components/Header';
import CustomUpload from './components/CustomUpload';
import Home from './components/Home';
import Signup from './components/Signup';
import Login from './components/Login';

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
  return(
    <>
    <RouterProvider router={router}/>
    </>
  )

  
}

export default App
