import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { NavLink, useNavigate } from 'react-router-dom';
import {  Link, Text, Divider, Box, FormControl, FormLabel, FormErrorMessage, Spacer, Flex } from '@chakra-ui/react';
import { Input } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useAuthValue } from "../AuthContext"
import { axiosBaseUrl } from '../axiosBaseUrl';
import TermsAndConditions from './TermsAndConditions';
import { Button } from 'antd';


const Login = () => {
    const { currentUser, isPrivacyMode, setIsPrivacyMode } = useAuthValue()
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        document.getElementById("email-input").focus();
    }, []);

    const onLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                setIsLoading(false)
                const user = userCredential.user;
                navigate("/");
            })
            .catch((error) => {
                console.error("Login Error:", error.code, error.message);
                setLoginError('Invalid username or password.');
            });
    }

    return (
        <Flex direction="column" h='100vh' bg="#fffff8" color="black" p={5}>
        <Box h='100vh' bg="#fffff8" color="black" p={5}>
            <Text bgColor='black' bgClip='text' fontSize='4xl' fontWeight='extrabold'>
                Chat with any PDF
            </Text>
            <Divider my={4} />
            <Text bgColor='black' bgClip='text' fontSize='2xl' fontWeight='normal'>
                Sign In
            </Text>
            {loginError && <Text color="red.500">{loginError}</Text>}
            <form onSubmit={onLogin}>
                <FormControl id="email-form" isInvalid={loginError} my={4}>
                    <FormLabel>Email address:</FormLabel>
                    <Input id="email-input" status={loginError ? 'error' : ''} placeholder="Email address" onChange={(e) => setEmail(e.target.value)} />
                    <FormErrorMessage>{loginError}</FormErrorMessage>
                </FormControl>
                <FormControl id="password-form" isInvalid={loginError} my={4}>
                    <FormLabel>Password:</FormLabel>
                    <Input.Password
                        status={loginError ? 'error' : ''}
                        type="password"
                        placeholder="Password"
                        required
                        onChange={(e) => setPassword(e.target.value)}
                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                    <FormErrorMessage>{loginError}</FormErrorMessage>
                </FormControl>
                <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={isLoading} 
                    block
                >
                    Login
                </Button>
            </form>
            <Text>
                No account yet?{' '}
                <NavLink to="/signup">
                    <Link color='teal.500'>
                        Sign up
                    </Link>
                </NavLink>
            </Text>
            
        </Box>
        <Spacer />
        <TermsAndConditions />
        </Flex>
    );
}

export default Login;
