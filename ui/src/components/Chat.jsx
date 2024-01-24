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
} from '@chakra-ui/react';
import { axiosBaseUrl } from '../axiosBaseUrl';
import { useAuthValue } from "../AuthContext"
import { HamburgerIcon, CopyIcon, CheckIcon } from '@chakra-ui/icons';
import Loader from './Loader'
import { useClipboard } from '@chakra-ui/react';
import './Chat.css'
const Chat = () => {
    const { onCopy, value, setValue, hasCopied } = useClipboard("");

  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState(null)
  const [vectorDB, setVectorDB] = useState('')
  const [vectorDBList, setVectorDBList] = useState([])
  const [loading, setLoading] = useState(false)
  const [sources, setSources] = useState([])
  const [currentConversation, setCurrentConversation] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [systemPrompt, setSystemPrompt] = useState('');
  const btnRef = useRef();
  const messagesEndRef = useRef(null);
  const [convoHistory, setConvoHistory] = useState([]);

  const { currentUser } = useAuthValue()

    useEffect(() => {
    axiosBaseUrl.get(`/databases/${currentUser.uid}`)
        .then((response) =>{
            setVectorDBList(response.data)
        })
    axiosBaseUrl.post(`/convo_history`, {uid: currentUser.uid})
        .then((response) =>{
            setConvoHistory(response.data)
        })
    },[])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (messages.length) scrollToBottom();
    }, [messages]);

    const handleSelectRAG = (vectorDB) => {
      setVectorDB(vectorDB);
      // Step 1: Filter the list
      const filteredRag = convoHistory.filter(item => item.rag === vectorDB);
      // Step 2: Sort the filtered list by 'created_at'
      const sortedRag = filteredRag.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      // Step 3: Transform into the desired format
      const convo = sortedRag.flatMap(item => [
          { text: item.prompt, sender: 'user' },
          { text: item.response, sender: 'llm', sources: item.sources }
      ]);
      axiosBaseUrl.post(`/rag_configs`, {user_id: currentUser.uid, input_directory: vectorDB})
        .then((response) => {
          setSystemPrompt(response.data)
      })
      setMessages(convo)
      console.log("convo::: ", convo);
      onClose();
    };


      const handleCopy = (text) => {
        const { onCopy } = useClipboard(text);
        onCopy(); // This will copy the text
      };
    

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
            setMessages([...messages, { text: prompt, sender: 'user'}, { text: response.data.answer, sender: 'llm', sources: sauces}]);
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
       <Flex justifyContent="space-between" alignItems="center" className="chatContainer">
        <IconButton
          ref={btnRef}
          icon={<HamburgerIcon />}
          onClick={onOpen}
          variant="outline"
          m={2}
        />
        <Heading as="mark" size="md" mr={2}>{vectorDB}</Heading>
      </Flex>
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} finalFocusRef={btnRef}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Choose a Conversation</DrawerHeader>
          <DrawerBody>
            {vectorDBList.map((vDB) => (
              <Button
                key={vDB}
                variant="ghost"
                justifyContent="flex-start"
                w="100%"
                onClick={() => {
                    handleSelectRAG(vDB);
                  onClose();
                }}
              >
                {vDB}
              </Button>
            ))}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <VStack spacing={4} >
        
        <Box width="100%" textAlign="left" overflowY="scroll" className="chatContainer">
          {messages.map((message, index) => (
                <Box key={index} alignSelf={message.sender === 'user' ? 'flex-end' : 'flex-start'} >
               {message.sender === 'user' ? (
                <Text fontSize="xl" as="b"  style={{ textAlignLast: "left"}}>
                  {message.text}
                </Text>
              ) : (

                <Flex direction="column" alignItems="flex-end">
                  {/* <Box boxShadow="md" borderWidth="1px" borderColor="gray.200" borderRadius='md' p={2}> */}
                  <Flex alignItems="center">
                        <Text flex="1"  textAlign="left" borderRadius="md" onClick={()=> setValue(message.text)}>{message.text}</Text>
                            <IconButton
                            aria-label="Copy message"
                            icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
                            size="sm"
                            onClick={() => onCopy(message.text)}
                            variant="ghost"
                            ml={2}
                            />
                    </Flex>
                    
                    
                <Accordion allowToggle width="100%">
                    <AccordionItem>
                    <AccordionButton justifyContent="space-between">
                        <Box flex="1" borderRadius='md' textAlign="right">
                        <Text as="mark">Sources</Text>
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
                {/* </Box> */}
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