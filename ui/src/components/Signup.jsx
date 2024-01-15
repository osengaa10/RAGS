import React, {useState} from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {  createUserWithEmailAndPassword  } from 'firebase/auth';
import { auth } from '../firebase';
import {
    Button, Link, Text, Divider,
  } from '@chakra-ui/react'
import { Input } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';

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
            fontSize='4xl'
            fontWeight='extrabold'
            >
                Chat with you docs
            </Text> 
            <Divider orientation='horizontal' />
            <Text
            style={{paddingTop: '10px'}}
            bgColor='black'
            bgClip='text'
            fontSize='2xl'
            fontWeight='normal'
            >
                Sign Up
            </Text>                        
                                                
                <form>                                              
                    <div style={{padding: '5px'}}>
                        <label style={{paddingRight: '5px'}} htmlFor="email-address">
                            Email address:
                        </label>
                        
                        <Input style={{maxWidth: '350px'}} placeholder="Email address" onChange={(e)=>setEmail(e.target.value)}/>
                    </div>
                    <div style={{padding: '20px'}}>
                        <label style={{paddingRight: '5px'}} htmlFor="password">
                            Password:
                        </label>
                        <Input.Password
                            style={{maxWidth: '350px'}} 
                            type="password" 
                            placeholder="Password" 
                            required 
                            onChange={(e)=>setPassword(e.target.value)}
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            />
                    </div>
                    <Button m="10px" colorScheme='blue' onClick={onSubmit}
                        _hover={{
                            bgGradient: 'linear(to-r, red.500, yellow.500)',
                        }}>Sign Up
                    </Button>                          
                </form>
                
                <Text>
                    No account yet? {' '}
                    <NavLink to="/login">
                        <Link color='teal.500' href='#'>
                            Sign in
                        </Link>
                    </NavLink>
                </Text>
                                            
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