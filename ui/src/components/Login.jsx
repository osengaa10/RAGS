import React, {useState} from 'react';
import {  signInWithEmailAndPassword   } from 'firebase/auth';
import { auth } from '../firebase';
import { NavLink, useNavigate } from 'react-router-dom'
import {
    Button, Link, Text, Divider,
  } from '@chakra-ui/react'
import { Input } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(null);
       
    const onLogin = (e) => {
        e.preventDefault();
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            navigate("/")
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage)
            setLoginError('error')
        });
       
    }
 
    return(
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
                Sign In
            </Text> 
            { loginError ?
                <Text as="em" color="red">
                    No account found with that username or password
                </Text>
                :
                <></>
            }                       
                                                
                <form>                                              
                    <div style={{padding: '5px'}}>
                        <label style={{paddingRight: '5px'}} htmlFor="email-address">
                            Email address:
                        </label>
                        
                        <Input status={loginError} style={{maxWidth: '350px'}} placeholder="Email address" onChange={(e)=>setEmail(e.target.value)}/>
                    </div>
                    <div style={{padding: '20px'}}>
                        <label style={{paddingRight: '5px'}} htmlFor="password">
                            Password:
                        </label>
                        <Input.Password
                            status={loginError}
                            style={{maxWidth: '350px'}} 
                            type="password" 
                            placeholder="Password" 
                            required 
                            onChange={(e)=>setPassword(e.target.value)}
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                        
                    </div>
                    <Button m="5px" colorScheme='blue' onClick={onLogin}
                        _hover={{
                            bgGradient: 'linear(to-r, red.500, yellow.500)',
                        }}>login
                    </Button>                           
                </form>
                <Text>
                    No account yet? {' '}
                    <NavLink to="/signup">
                        <Link color='teal.500' href='#'>
                            Sign up
                        </Link>
                    </NavLink>
                </Text>
                                            
            </div>
        </>
    )
}
 
export default Login