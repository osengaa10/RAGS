import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { 
    Button, 
    Link, 
    Text, 
    Divider, 
    Box, 
    FormControl, 
    FormLabel, 
    FormErrorMessage, 
    Switch, 
    // useColorMode, 
    Flex,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    Tooltip,
    IconButton,
    UnorderedList,
    ListItem
} from '@chakra-ui/react';
import { QuestionOutlineIcon } from '@chakra-ui/icons';
import { useAuthValue } from "../AuthContext"
import { Input } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { axiosBaseUrl } from '../axiosBaseUrl';


const Signup = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [signupError, setSignupError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { isPrivacyMode, setIsPrivacyMode } = useAuthValue();
    const [localDarkMode, setLocalDarkMode] = useState(false); // Local dark mode state

    console.log("isPrivacyMode:: ", isPrivacyMode)
    useEffect(() => {
        document.getElementById("email-input").focus();
    }, []);

    useEffect(() => {
        // Toggle dark mode based on the privacy mode
        setLocalDarkMode(isPrivacyMode);
        console.log("isPrivacyMode:: ", isPrivacyMode)
    }, [isPrivacyMode]);

    const togglePrivacyMode = () => {
        setIsPrivacyMode(!isPrivacyMode);
      };
    const onSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("userCredential: ", userCredential)
                if(isPrivacyMode) {
                    axiosBaseUrl.post('/set_privacy_flag', {user_id: userCredential.user.uid})
                        .then((response) => {
                        console.log("privacy response: ", response)
                    })
                }
                navigate("/login");
            })
            .catch((error) => {
                console.error("Signup Error:", error.code, error.message);
                setSignupError('An error occurred during signup. Please try again.');
                setIsLoading(false);
            });
    }

        // Define styles for dark mode
        const darkModeStyles = {
            backgroundColor: '#202023',
            color: 'white',
        };

    return (
        <Box h='100vh' style={localDarkMode ? darkModeStyles : { backgroundColor: '#fffff8', color: 'black' }} p={5}>
            <Text style={localDarkMode ? { color: 'white' } : { color: 'black' }} fontSize='4xl' fontWeight='extrabold'>
                Chat with any PDF
            </Text>
            <Divider my={4} />
            <Text style={localDarkMode ? { color: 'white' } : { color: 'black' }} fontSize='2xl' fontWeight='normal'>
                Sign Up
            </Text>
            {signupError && <Text color="red.500">{signupError}</Text>}
            <form onSubmit={onSubmit}>
                <FormControl id="email-form" isInvalid={!!signupError} my={4}>
                    <FormLabel>Email address:</FormLabel>
                    <Input id="email-input" placeholder="Email address" onChange={(e) => setEmail(e.target.value)} />
                    <FormErrorMessage>{signupError}</FormErrorMessage>
                </FormControl>
                <FormControl id="password-form" isInvalid={!!signupError} my={4}>
                    <FormLabel>Password:</FormLabel>
                    <Input.Password
                        type="password"
                        placeholder="Password"
                        required
                        onChange={(e) => setPassword(e.target.value)}
                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                    <FormErrorMessage>{signupError}</FormErrorMessage>
                </FormControl>
                <Flex alignItems="center" mb={4}>
                    <Switch id="privacy-mode" onChange={() => togglePrivacyMode(!isPrivacyMode)} isChecked={isPrivacyMode} />
                    <FormLabel htmlFor="privacy-mode" ml={2}>Privacy Mode</FormLabel>
                    <Popover >
                            <Tooltip label="What is privacy mode?" hasArrow>
                            <Box display="inline-block">
                            <PopoverTrigger>
                            <IconButton
                                  aria-label="View system prompt"
                                  icon={<QuestionOutlineIcon />}
                                  size="sm"
                                  varia nt="ghost"
                                  ml={2}
                                />
                           
                            </PopoverTrigger>
                            </Box>
                            </Tooltip>
                            <PopoverContent style={{ color: 'black' }}>
                                <PopoverArrow />
                                <PopoverCloseButton />
                                <PopoverHeader>Privacy measures:</PopoverHeader>
                                <PopoverBody>
                                <UnorderedList align="left">
                                    <ListItem>Raw PDF files will never be archived in any way.</ListItem>
                                    <ListItem>Only embeddings of the PDFs will be maintained until you chose to delete them.</ListItem>
                                    <ListItem>A privacy enabled account will never touch a database.</ListItem>
                                </UnorderedList>
                                </PopoverBody>
                                <PopoverHeader>Feature limitations:</PopoverHeader>
                                <PopoverBody>
                                <UnorderedList align="left">
                                    <ListItem>No conversational history.</ListItem>
                                    <ListItem>Cannot view or download PDFs in your knowledge bases</ListItem>
                                    <ListItem>To use a custom system prompt, it will need to be specified for each prompt.</ListItem>
                                </UnorderedList>
                                </PopoverBody>
                            </PopoverContent>
                          </Popover>
                </Flex>
                <Button isLoading={isLoading} type="submit" colorScheme='blue' w="full"
                    _hover={{
                        bgGradient: 'linear(to-r, red.500, yellow.500)',
                    }}>Sign Up
                </Button>
            </form>
            <Text>
                Already have an account?{' '}
                <NavLink to="/login">
                    <Link color='teal.500'>
                        Sign in
                    </Link>
                </NavLink>
            </Text>
            <Text as='i' mt={4}>
                We will never email you. Not even for a signup confirmation.
                Real or fake email, we don't care. 
                Just make sure you remember these credentials,
                as this will be used to retrieve your previous knowledge bases.
            </Text>
        </Box>
    );
}

export default Signup;
