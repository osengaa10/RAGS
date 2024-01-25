import { useState, useEffect } from 'react'
import '../App.css'
import {
  Box,
  keyframes,
  Text,
  Flex
} from '@chakra-ui/react'
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../firebase';
import Chat from './Chat';
import { useAuthValue } from "../AuthContext"
import PrivacyLoader from './PrivacyLoader';
import { axiosBaseUrl } from '../axiosBaseUrl';

function Home() {
  const { currentUser, isPrivacyMode, setIsPrivacyMode } = useAuthValue()

  const [gradients, setGradients] = useState('radial(gray.100, gray.200, gray.300)')

  useEffect(()=>{
    onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/firebase.User
          const uid = user.uid;
          axiosBaseUrl.post('/is_private', {user_id: currentUser.uid})
            .then((response) => {
            setIsPrivacyMode(response.data.privacy)
          })
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
      // bgGradient={gradients}
      bg="#fffff8"
      color="black"
      animation= {`${animation} 1s linear infinite`}
    >
    <div style={{padding: '10px'}}>
      {isPrivacyMode ?
        <Flex direction="row" justifyContent="center" alignItems="center" >
        <Text
          bgColor='black'
          bgClip='text'
          fontSize='4xl'
          style={{margin: '0px'}}
        >
          Privacy M
        </Text> 
        <PrivacyLoader/>
        <Text
          bgColor='black'
          bgClip='text'
          fontSize='4xl'
          style={{margin: '0px'}}
        >
          de
        </Text> 
      </Flex>
      :
      <Text
      bgColor='black'
      bgClip='text'
      fontSize='4xl'
    >
      Ask a question
    </Text>
      }
      
        
            
      <Chat />
    </div>
    </Box>
    </>

  )
}

export default Home
