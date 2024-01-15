import { useState, useEffect } from 'react'
import '../App.css'
import {
  Box,
  keyframes,
  Text
} from '@chakra-ui/react'
import PromptAndResponse from './PrompAndResponse';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../firebase';


function Home() {

  const [gradients, setGradients] = useState('radial(gray.300, yellow.400, pink.200)')

  useEffect(()=>{
    onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/firebase.User
          const uid = user.uid;
          // ...
          console.log("uid", uid)
        } else {
          // User is signed out
          // ...
          console.log("user is logged out")
        }
      });
     
}, [])
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
        fontSize='4xl'
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
