import { useState, useEffect } from 'react'
import '../App.css'
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
import NavBar from './NavBar';
import PromptAndResponse from './PrompAndResponse';

function Home() {

  const [gradients, setGradients] = useState('radial(gray.300, yellow.400, pink.200)')

  const animation = keyframes `
  to {
     background-position: 200%;
   }
`

  return (
    <>
    <Box
      h='calc(100vh)'
      style={{overflow: 'auto'}}
      bgGradient={gradients}
      animation= {`${animation} 1s linear infinite`}
    >
      {/* <NavBar /> */}
    <div style={{padding: '50px'}}>
       <Text
        bgColor='black'
        bgClip='text'
        fontSize='6xl'
        fontWeight='extrabold'
      >
        Ask a question
      </Text> 
      <PromptAndResponse />  
    </div>
    </Box>
    </>

  )
}

export default Home
