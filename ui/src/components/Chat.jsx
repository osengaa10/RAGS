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
import { HamburgerIcon } from '@chakra-ui/icons';



const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState(null)
  const [vectorDB, setVectorDB] = useState('')
  const [vectorDBList, setVectorDBList] = useState([])
  const [loading, setLoading] = useState(null)
  const [sources, setSources] = useState([])
  const [currentConversation, setCurrentConversation] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();
  const [user, setUser] = useState(null);

  const { currentUser } = useAuthValue()

    useEffect(() => {
    axiosBaseUrl.get(`/databases/${currentUser.uid}`)
        .then((response) =>{
        setVectorDBList(response.data)
        })
    },[])

    const handleSelectRAG = (vectorDB) => {
        setVectorDB(vectorDB);
        onClose();
      };
    

  const handleSendMessage = () => {
    // if (prompt.trim()) {
      axiosBaseUrl.post(`/qa`, {query: prompt, input_directory: vectorDB, user_id: currentUser.uid})
          .then((response) => {
            setAnswer(response.data.answer)
            setLoading(null)
            setSources(response.data.sources)
            // setMessages([...messages, { text: answer, sender: 'llm'}]);
            setMessages([...messages, { text: prompt, sender: 'user'}, { text: response.data.answer, sender: 'llm'}]);
            console.log("messages:::", messages);
          }).catch((e) => {
            // setError('Api screwed up')
            alert('Api screwed up')
          })
      setPrompt('');
  };

  const width = useBreakpointValue({ base: '99%', md: '400px' });
  const maxHeight = useBreakpointValue({ base: '60vh', md: '300px' });

  return (
    <Box width="100%" height="100%" bg="gray.100" p={4} borderRadius="lg" boxShadow="md">
       <Flex justifyContent="space-between" alignItems="center">
        <IconButton
          ref={btnRef}
          icon={<HamburgerIcon />}
          onClick={onOpen}
          variant="outline"
          m={2}
        />
        <Heading size="md" mr={2}>{vectorDB}</Heading>
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
      <VStack spacing={4}>
        
        <Box width="100%" overflowY="scroll">
          {messages.map((message, index) => (
            <Box key={index} p={4} alignSelf={message.sender === 'user' ? 'flex-end' : 'flex-start'}>
               {message.sender === 'user' ? (
                <Text textAlign='left' bg="blue.100" p={2} borderRadius="md">
                  {message.text}
                </Text>
              ) : (
                <Accordion allowToggle>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          {message.text}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    {sources.map(sauce =>
                        <AccordionPanel textAlign='left' pb={4}>
                        {/* Replace this with actual source list */}
                        PAGE {sauce.metadata.page}: {sauce.page_content}
                      </AccordionPanel>
                    )}
                    
                  </AccordionItem>
                </Accordion>
              )}
            </Box>
          ))}
        </Box>
        <Divider />
        <Input
          placeholder="Type a message..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button colorScheme="blue" onClick={handleSendMessage}>
          Send
        </Button>
      </VStack>
    </Box>
  );
};

export default Chat;