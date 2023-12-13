import { useState, useEffect } from 'react'
import '../App.css'
import {
  Box,
  keyframes,
  Text
} from '@chakra-ui/react'
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
