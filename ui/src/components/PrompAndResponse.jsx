import { useState, useEffect } from 'react'
import axios from 'axios'
import {
    AccordionPanel,
    Accordion,
    AccordionItem,
    AccordionButton,
    Box,
    AccordionIcon,
    Spinner,
    keyframes,
    Button, Textarea, Text, Divider,
    IconButton,
  } from '@chakra-ui/react'

  function PromptAndResponse(){
    const [prompt, setPrompt] = useState('')
    const [answer, setAnswer] = useState(null)
    const [sources, setSources] = useState([])
    const [loading, setLoading] = useState(null)
    const [gradients, setGradients] = useState('radial(gray.300, yellow.400, pink.200)')

    const handleChange = (e) => {
        const value = e.target.value;
        setPrompt(value)
    }

    const handleClick = (e) => {
        e.preventDefault();
        console.log("prompt to API:: ", {query: prompt})
        setLoading('loading...')
        setGradients('linear(to-r, green.200, pink.500)')
        axios.post(`http://localhost:8000/qa`, {query: prompt})
          .then((response) => {
            console.log("prompt sent to api: ", prompt)
            console.log("response:: ", response)
            setAnswer(response.data.answer)
            setLoading(null)
            setSources(response.data.sources)
            setGradients('radial(gray.300, yellow.400, pink.200)')
          }).catch((e) => {
            setError('Api screwed up')
            alert('Api screwed up')
          })
      }

    return(
        <>
        <Textarea m='10px' placeholder='ask a question' onChange={handleChange} />
        <Button m="10px" colorScheme='blue' onClick={handleClick}
           _hover={{
            bgGradient: 'linear(to-r, red.500, yellow.500)',
          }}>Ask Jeeves</Button>
        
        {(!loading && answer)? 
        <>
        <Text className='lineformat' fontSize='lg'>{answer}</Text>
        <Text m='10px' fontSize='2xl'>Sources:</Text>
        </>
        : <br/>
        }
      {loading ? 
        <Spinner
          thickness='4px'
          speed='0.65s'
          emptyColor='green.200'
          color='pink.500'
          size='xl'
        /> 
        : <br/> }
      {!loading ? sources.map(sauce => 
      <>
      <Divider orientation='horizontal' />
    <Accordion defaultIndex={[1]} allowMultiple>
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box as="span" flex='1' textAlign='left'>
            <Text fontSize='lg'>{(sauce.metadata.source).substring((sauce.metadata.source).lastIndexOf('/') + 1)}</Text>
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel pb={4}>
        <Text textAlign='left' fontSize='sm'>PAGE {sauce.metadata.page}: {sauce.page_content}</Text>
      </AccordionPanel>
    </AccordionItem>
    </Accordion>
  </>
    ) :     
    <br/>
  }   
  </>
    )
  }

  export default PromptAndResponse