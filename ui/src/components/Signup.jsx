import React, {useState} from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {  createUserWithEmailAndPassword  } from 'firebase/auth';
import { auth } from '../firebase';
import {
    AccordionPanel,
    Accordion,
    AccordionItem,
    AccordionButton,
    Box,
    AccordionIcon,
    Spinner,
    Select,
    Button, Textarea, Text, Divider,
  } from '@chakra-ui/react'
  import { Input, Row, Col } from 'antd';

const Signup = () => {
    const navigate = useNavigate();
 
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('');
 
    const onSubmit = async (e) => {
      e.preventDefault()
     
      await createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log(user);
            navigate("/login")
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            // ..
        });
 
   
    }
 
  return (
    <>  
        <div>                                            
            <Text
            bgColor='black'
            bgClip='text'
            fontSize='6xl'
            fontWeight='extrabold'
            >
                Give an LLM a memory
            </Text>                        
                                                
                <form>                                              
                    <div style={{padding: '20px'}}>
                        <label htmlFor="email-address">
                            Email address
                        </label>
                        
                        <Input placeholder="Email address" onChange={(e)=>setEmail(e.target.value)}/>
                    </div>
                    <div style={{padding: '20px'}}>
                        <label htmlFor="password">
                            Password
                        </label>
                        <Input type="password" placeholder="Password" required onChange={(e)=>setPassword(e.target.value)}/>
                        <Button m="10px" colorScheme='blue' onClick={onSubmit}
                        _hover={{
                            bgGradient: 'linear(to-r, red.500, yellow.500)',
                        }}>Sign Up
                        </Button>
                    </div>                             
                </form>
                
                <p className="text-sm text-white text-center">
                    Already have an account? {' '}
                    <NavLink to="/login">
                        <Button m="5px" colorScheme='blue'
                        _hover={{
                            bgGradient: 'linear(to-r, red.500, yellow.500)',
                        }}>Sign in
                        </Button>
                    </NavLink>
                </p>
                                            
            </div>
            <br></br>
            <Text as='i'>
                We will never email you. Not even for a signup confirmation.
                Real or fake email, we don't care. 
                Just make sure you remember these credentials,
                as this will be used to retrieve your previous knowledge bases.
            </Text>
        </>
  )
}
 
export default Signup