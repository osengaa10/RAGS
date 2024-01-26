import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Button,
    Input,
    VStack,
    Text,
    IconButton,
    useBreakpointValue,
    Divider,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    useDisclosure,
    Flex,
    Heading,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    Tooltip
} from '@chakra-ui/react';
import { axiosBaseUrl } from '../axiosBaseUrl';
import { useAuthValue } from "../AuthContext"
import { HamburgerIcon, CopyIcon, CheckIcon, QuestionOutlineIcon } from '@chakra-ui/icons';
import Loader from './Loader'
import { useClipboard } from '@chakra-ui/react';
import SideDrawer from './SideDrawer';

const Chat = () => {
  const { onCopy, value, setValue, hasCopied } = useClipboard("");
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sources, setSources] = useState([])
  const { isOpen, onOpen, onClose, onToggle } = useDisclosure();
  const btnRef = useRef();
  const messagesEndRef = useRef(null);
  
  const { 
    currentUser, 
    isPrivacyMode, 
    setVectorDBList,
    vectorDB,
    setVectorDB,
    messages,
    setMessages,
    setConvoHistory,
    systemPrompt
  } = useAuthValue()

    useEffect(() => {
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
    },[])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (messages.length) scrollToBottom();
    }, [messages]);

    

  const handleSendMessage = () => {
    // if (prompt.trim()) {
    setLoading(true)
    console.log("systemPrompt::: ", systemPrompt)
    axiosBaseUrl.post(`/qa`, {query: prompt, input_directory: vectorDB, user_id: currentUser.uid, system_prompt: systemPrompt})
          .then((response) => {
            setAnswer(response.data.answer)
            setLoading(false)
            setSources(response.data.sources)
            const sauces = (response.data.sources).map(sauce => sauce.page_content)
            setMessages([...messages, { text: prompt, sender: 'user', system_prompt: systemPrompt}, { text: response.data.answer, sender: 'llm', sources: sauces}]);
            if(!isPrivacyMode) {
              axiosBaseUrl.post(`/archive_message`, 
                {
                    uid: String(currentUser.uid), 
                    rag: vectorDB, 
                    prompt: prompt, 
                    response: response.data.answer, 
                    sources: sauces,
                    system_prompt: systemPrompt
                })
                .then((res) => {
                    console.log(`response from db: ${res}`)
                })
                .catch((err) => {
                    console.log(`convo error ${err}`)
                })
            }
            
          })
          .catch((e) => {
            console.log(`llm error ${e}`)
            alert('Api screwed up')
          }) 
      setPrompt('');
  };

  const width = useBreakpointValue({ base: '99%', md: '400px' });
  const maxHeight = useBreakpointValue({ base: '60vh', md: '300px' });

  return (
    <>
       <Flex justifyContent="space-between" alignItems="center">
        <Heading size="md" mr={2}>{vectorDB}</Heading>
      </Flex>
      <VStack spacing={4}>
        
        <Box width="100%" overflowY="scroll">
          {messages.map((message, index) => (
                <Box key={index} p={2} alignSelf={message.sender === 'user' ? 'flex-end' : 'flex-start'}>
               {message.sender === 'user' ? (
                <Text textAlign='left' bg="blue.100" borderWidth="1px" borderColor="blue.200" boxShadow="md" p={2} borderRadius="md">
                  {message.text}
                </Text>
              ) : (
                <Flex direction="column" alignItems="flex-end">
                  <Box boxShadow="md" borderWidth="1px" borderColor="gray.200" borderRadius='md' p={2}>
                  <Flex alignItems="center">
                        <Text flex="1"  textAlign="left" borderRadius="md" onClick={()=> setValue(message.text)}>{message.text}</Text>
                        <Flex direction="column">
                          <IconButton
                              aria-label="Copy message"
                              icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
                              size="sm"
                              onClick={() => onCopy(message.text)}
                              variant="ghost"
                              ml={2}
                              />
                               
                            <Popover>
                            <Tooltip label="View system prompt for this response" hasArrow>
                            <Box display="inline-block">
                            <PopoverTrigger>
                            <IconButton
                                  aria-label="View system prompt"
                                  icon={<QuestionOutlineIcon />}
                                  size="sm"
                                  variant="ghost"
                                  ml={2}
                                />
                           
                            </PopoverTrigger>
                            </Box>
                            </Tooltip>
                            <PopoverContent>
                                <PopoverArrow />
                                <PopoverCloseButton />
                                <PopoverHeader>System Prompt:</PopoverHeader>
                                <PopoverBody>{message.system_prompt}</PopoverBody>
                            </PopoverContent>
                          </Popover>
                         
                        </Flex>
                            
                    </Flex>
                <Accordion allowToggle width="100%">
                    <AccordionItem>
                    <AccordionButton justifyContent="space-between">
                        <Box flex="1" borderRadius='md' textAlign="right">
                        Sources
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    
                    {
                        message.sources && message.sources.length > 0 ?
                        message.sources.map(sauce =>
                            <AccordionPanel textAlign='left' pb={4}>
                                {sauce}
                            </AccordionPanel>
                        ) : <AccordionPanel>No sources available</AccordionPanel>
                    }
                    </AccordionItem>
                </Accordion>
                </Box>
                </Flex>
              )}
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>
        <Divider />
        { loading ? 
        <Loader />
        :
        <>
        <Input
          placeholder="Type a message..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button colorScheme="blue" onClick={handleSendMessage}>
          Send
        </Button>
        </>
        }
        
      </VStack>
    </>
  );
};

export default Chat;