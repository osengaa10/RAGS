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
import Chat from './Chat';


function Home() {

  const [gradients, setGradients] = useState('radial(gray.100, gray.200, gray.300)')

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
      color="black"
      animation= {`${animation} 1s linear infinite`}
    >
    <div style={{padding: '10px'}}>
       <Text
        bgColor='black'
        bgClip='text'
        fontSize='4xl'
        fontWeight='extrabold'
      >
        Ask a question
      </Text> 
            
      <Chat />
    </div>
    </Box>
    </>

  )
}

export default Home
