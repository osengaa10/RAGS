import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import './App.css'
import Header from './components/Header';
import CustomUpload from './components/CustomUpload';
import Home from './components/Home';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Header />}>
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
