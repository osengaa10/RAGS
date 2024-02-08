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
import { NavLink, useNavigate } from 'react-router-dom';
import { notification, message } from 'antd';
import SuccessToast from './SuccessToast';


function Home() {
  const navigate = useNavigate();
  const { 
    currentUser, 
    isPrivacyMode, 
    setIsPrivacyMode, 
    vectorDB, 
    vectorDBList,
    setVectorDBList,
    setConvoHistory,
    setRunningRags,
    jobCompleteNotification,
    setJobCompleteNotification
  } = useAuthValue()
  const [gradients, setGradients] = useState('radial(gray.100, gray.200, gray.300)')
  useEffect(()=>{
    onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/firebase.User
          axiosBaseUrl.post('/is_private', {user_id: currentUser.uid})
            .then((response) => {
            setIsPrivacyMode(response.data.privacy)
          })
        } else {
          console.log("user is logged out")
        }
    });

      axiosBaseUrl.get(`/databases/${currentUser.uid}`)
      .then((response) =>{
          setVectorDBList(response.data)
      })
      if(!isPrivacyMode) {
        axiosBaseUrl.post(`/convo_history`, {uid: currentUser.uid})
        .then((response) =>{
            setConvoHistory(response.data)
        })
   }
   axiosBaseUrl.post(`/jobs_in_progress`, {uid: currentUser.uid})
   .then((response) =>{
    setRunningRags(response.data)
       console.log("rags response :::", response.data)
       if(response.data.length > 0) {
        message.loading({ content: `${response.data} is in progress`, key: 'runningRags' });
        // Close the message after 2 seconds
        setTimeout(() => {
          message.destroy('runningRags');
        }, 2000);
      }
   })


  
     
}, [])

    useEffect(() => {
        // Initialize the WebSocket connection
        const websocketBaseUrl = import.meta.env.VITE_WEBSOCKET_URL
        const ws = new WebSocket(`${websocketBaseUrl}/${currentUser.uid}`);
        // const ws = new WebSocket(`ws://localhost:8000/ws/${currentUser.uid}`);
        // Define the event handler for incoming messages
        ws.onmessage = (event) => {
            const message = event.data;
            console.log("MESSAGE FROM WEBSOCKET:::: ", message);
            // Handle the message (e.g., display a notification in the UI)
            setJobCompleteNotification(message);
        };

        axiosBaseUrl.post(`/job_notifications`, {uid: currentUser.uid})
            .then((response) => {
                if(response.data.length > 0) {
                    setJobCompleteNotification(response.data)
                }
            })
        // Return a cleanup function that closes the WebSocket connection
        // This function is called when the component unmounts or before the effect runs again
        return () => {
            ws.close();
        };

    }, [currentUser.uid]);


  const animation = keyframes `
  to {
     background-position: 200%;
   }
`

  return (
    <>
    <Box
      h='calc(100vh)'
      bg="#fffff8"
      color="black"
      animation= {`${animation} 1s linear infinite`}
    >
        <SuccessToast /> 
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
      {vectorDB}
    </Text>
      }
      {!vectorDBList.length ?
      navigate("/custom")
        :
        <Chat />
      }
      {/* <Chat /> */}
    </div>
    </Box>
    </>

  )
}

export default Home
