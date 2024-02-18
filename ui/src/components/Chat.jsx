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
    PopoverFooter,
    Tooltip,
    Textarea
} from '@chakra-ui/react';
import { axiosBaseUrl } from '../axiosBaseUrl';
import { useAuthValue } from "../AuthContext"
import { CopyIcon, CheckIcon, QuestionOutlineIcon } from '@chakra-ui/icons';
import { 
    InboxOutlined, 
    InfoCircleOutlined, 
    CloudSyncOutlined, 
    PlusOutlined,
    EyeOutlined,
    DeleteOutlined,
    
  } from '@ant-design/icons';
import Loader from './Loader'
import KnowledgeBaseDropdown from './KnowledgeBaseDropdown'
import { useClipboard } from '@chakra-ui/react';
import PrivacyModeSystemPrompt from './PrivacyModeSystemPrompt'
import SystemPromptExampleModal from './SystemPromptExampleModal';


const Chat = () => {
  const { onCopy, value, setValue, hasCopied } = useClipboard("");
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sources, setSources] = useState([])
  const [pageNumbers, setPageNumbers] = useState([])
  const [sourceDocNames, setSourceDocNames] = useState([])
  const { isOpen, onOpen, onClose, onToggle } = useDisclosure();
  const btnRef = useRef();
  const messagesEndRef = useRef(null);

  const { 
    currentUser, 
    isPrivacyMode, 
    vectorDB,
    messages,
    setMessages,
    systemPrompt,
    setSystemPrompt
  } = useAuthValue()

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
    axiosBaseUrl.post(`/qa`, {query: prompt, input_directory: vectorDB, user_id: currentUser.uid, system_prompt: systemPrompt, privacy_mode: isPrivacyMode})
        .then((response) => {
            setAnswer(response.data.answer)
            setLoading(false)
            setSources(response.data.sources)
            const sauces = (response.data.sources).map(sauce => sauce.page_content)
            const pageNumbers = (response.data.sources).map(sauce => sauce.metadata.page)
            const documentNames = (response.data.sources).map(sauce => sauce.metadata.source.match(/[^/]*$/))

            setMessages([...messages, 
                { text: prompt, sender: 'user', system_prompt: systemPrompt}, 
                { text: response.data.answer, sender: 'llm', sources: sauces, page_numbers: pageNumbers, document_names: documentNames}]);
            if(!isPrivacyMode) {
                axiosBaseUrl.post(`/archive_message`, 
                {
                    uid: String(currentUser.uid), 
                    rag: vectorDB, 
                    prompt: prompt, 
                    response: response.data.answer, 
                    sources: sauces,
                    document_names: documentNames,
                    page_numbers: pageNumbers,
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
        setLoading(false)
        }) 
    setPrompt('');
  };


  return (
    <>
       <Flex justifyContent="space-between" alignItems="center">
        {isPrivacyMode ?
          <Heading size="md" mr={2}>{vectorDB}</Heading>
          :
          <></>
        }
        
      </Flex>
      <VStack spacing={4}>
        {/* <Box width="100%" > */}
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
                  <Text flex="1" textAlign="left" borderRadius="md" onClick={()=> setValue(message.text)}>
                    {message.text.split('\n').map((line, index, array) => (
                        <React.Fragment key={index}>
                        {line}
                        {index !== array.length - 1 &&  <br />}
                        </React.Fragment>
                    ))}
                    </Text>

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
                        message.sources.map((sauce, index) => // Use the index to access corresponding elements
                        <AccordionPanel key={index} textAlign='left' pb={4}>
                            <b>Document Name:</b> {message.document_names && message.document_names[index]}
                            <br />
                            <b>Page Number: </b>{message.page_numbers && message.page_numbers[index]}
                            <br />
                           <b> Source:</b> {sauce}
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
        {/* </Box> */}
        <Divider />
        { loading ? 
        <Loader />
        :
        <>
        {(messages.length || vectorDB != '') ?
        <>
            <Input
            placeholder="Type a message..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          
          {isPrivacyMode ?
          <>
            {/* <Flex direction='row' justifyContent="space-between" alignItems="center"> */}
            <Button colorScheme="blue"  onClick={handleSendMessage}>
              Send
            </Button>
            <Text >Current system prompt</Text>
            <Flex justifyContent="center" alignItems="center">
            <Textarea
              placeholder="System prompt..."
              value={systemPrompt}
            //   onBlur={handleBlur}
              onChange={(e) => setSystemPrompt(e.target.value)}
              resize={'vertical'} 
            //   minH={'150px'}
              style={{ width: '90vw'}}
            />
            <Flex direction='column'>
            <Popover>
              <PopoverTrigger>
                <IconButton
                  aria-label="Info about system prompt"
                  icon={<InfoCircleOutlined />}
                  size="sm"
                  ml={2}
                />
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader>System Prompt Explanation</PopoverHeader>
                <PopoverBody>
                  The system prompt is a predefined input that helps guide the system's response generation.
                </PopoverBody>
                <PopoverFooter>
                  <SystemPromptExampleModal />
                </PopoverFooter>
              </PopoverContent>
            </Popover>
            
            <IconButton
                  aria-label="Info about system prompt"
                  icon={<DeleteOutlined />}
                  size="sm"
                  ml={2}
                  onClick={() => setSystemPrompt('')}
                />
          </Flex>
          </Flex>
        
            </>
             
           :
           <Flex direction='row'>
          <Button colorScheme="blue" onClick={handleSendMessage}>
            Send
          </Button>
          </Flex>
        }
        </>
          :
        <KnowledgeBaseDropdown />
        }
        
        </>
        }
        
      </VStack>
    </>
  );
};

export default Chat;