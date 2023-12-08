import { useState, useEffect } from 'react'
import './CustomUpload.css'
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
  import { 
    HamburgerIcon,
    EmailIcon,
    AddIcon,
    RepeatIcon,
    ChevronDownIcon,
    EditIcon } from '@chakra-ui/icons'
import PromptAndResponse from './PrompAndResponse'

function CustomUpload() {
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState(null)
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploaded, setUploaded] = useState(false)
  const [gradients, setGradients] = useState('radial(gray.300, yellow.400, pink.200)')

  const animation = keyframes `
  to {
     background-position: 200%;
   }
`

  const handleFileChange = (e) => {
    const files = e.target.files;
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      alert('Please select one or more files');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file, index) => {
      formData.append(`file`, file);
    });
    axios.post('http://localhost:8000/chunk_and_embed', formData)
    .then(response => {
      // Handle the response from the server
      console.log('File uploaded successfully:', response.data);
      setUploaded(true)
    })
    .catch(error => {
      // Handle errors
      console.error('Error uploading file:', error);
    });
  }

  return (
    <Box
      h='calc(100vh)'
      style={{overflow: 'auto'}}
      bgGradient={gradients}
      animation= {`${animation} 1s linear infinite`}
    >
    <div style={{padding: '50px'}}>
       <Text
        bgColor='black'
        bgClip='text'
        fontSize='6xl'
        fontWeight='extrabold'
      >
        Custom File Q&A
      </Text> 
      { uploaded ?
      <>
       <PromptAndResponse />  
      </>
      :
      <div>
      <input type="file" accept=".pdf" onChange={handleFileChange} multiple/>
      <Button m="10px" colorScheme='blue' onClick={handleUpload}
         _hover={{
          bgGradient: 'linear(to-r, red.500, yellow.500)',
        }}>Upload</Button>
    </div>
      }
 
    </div>
    </Box>

  )
}

export default CustomUpload

