import React, {useState} from 'react';
import {  signInWithEmailAndPassword   } from 'firebase/auth';
import { auth } from '../firebase';
import { NavLink, useNavigate } from 'react-router-dom'
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

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
       
    const onLogin = (e) => {
        e.preventDefault();
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            navigate("/")
            console.log(user);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage)
        });
       
    }
 
    return(
        <>
            <div>                                            
            <Text
            bgColor='black'
            bgClip='text'
            fontSize='6xl'
            fontWeight='extrabold'
            >
                Chat with PDFs
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
                        <Button m="10px" colorScheme='blue' onClick={onLogin}
                        _hover={{
                            bgGradient: 'linear(to-r, red.500, yellow.500)',
                        }}>login
                        </Button>
                    </div>                             
                </form>
                
                <p className="text-sm text-white text-center">
                    No account yet? {' '}
                    <NavLink to="/signup">
                        <Button m="5px" colorScheme='blue'
                        _hover={{
                            bgGradient: 'linear(to-r, red.500, yellow.500)',
                        }}>Sign up
                        </Button>
                    </NavLink>
                </p>
                                            
            </div>
        </>
    )
}
 
export default Login