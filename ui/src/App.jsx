import { useState, useEffect } from 'react'
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import './App.css'
import axios from 'axios'
import {
  AccordionPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  Box,
  AccordionIcon,
  Spinner,
  keyframes,
  Button, Textarea, Text, Divider
} from '@chakra-ui/react'
// import NavBar from './components/NavBar/NavBar'
import Header from './components/Header';
import CustomUpload from './components/CustomUpload';
import Home from './components/Home';
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Header />}>
      <Route index element={<Home />} />
      <Route path="custom" element={<CustomUpload />} />
      {/* <Route path="register" element={<Register />} /> */}
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
