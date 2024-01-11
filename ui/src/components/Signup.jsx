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
     {/* <main >         */}
        {/* <section> */}
            {/* <div>
                <div>                  
                    <h1> Chat with PDFs </h1>                                                                            
                    <form>                                                                                            
                        <div>
                            <label htmlFor="email-address">
                                Email address
                            </label>
                            <input
                                type="email"
                                label="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}  
                                required                                    
                                placeholder="Email address"                                
                            />
                        </div>

                        <div>
                            <label htmlFor="password">
                                Password
                            </label>
                            <input
                                type="password"
                                label="Create password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} 
                                required                                 
                                placeholder="Password"              
                            />
                        </div>                                             
                        
                        <button
                            type="submit" 
                            onClick={onSubmit}                        
                        >  
                            Sign up                                
                        </button>
                                                                     
                    </form>
                   
                    <p>
                        Already have an account?{' '}
                        <NavLink to="/login" >
                            Sign in
                        </NavLink>
                    </p>                   
                </div>
            </div> */}
        {/* </section> */}
    {/* </main> */}
   
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
        </>
  )
}
 
export default Signup