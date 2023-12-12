import { useState, useEffect } from 'react'
import './CustomUpload.css'
import axios from 'axios'
import {
  Box,
  Input,
  keyframes,
  Button,
} from '@chakra-ui/react'
import PromptAndResponse from './PrompAndResponse'

function CustomUpload() {
  const [ragName, setRagName] = useState('')
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

  const handleChange = (e) => {
    const value = e.target.value;
    setRagName(value)
  }
  const handleUpload = () => {
    if (selectedFiles.length === 0 || ragName === '') {
      alert('Select one or more files and name your RAG');
      return;
    }
    const formData = new FormData();
        selectedFiles.forEach((file, index) => {
      formData.append(`files`, file);
    });
    formData.append(`input_directory`, ragName)
    axios.post('http://localhost:8000/chunk_and_embed', formData)
    .then(response => {
      // Handle the response from the server
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
        <input style={{padding: '20px'}} type="file" accept=".pdf" onChange={handleFileChange} multiple/>
        <Input p="20px" placeholder='RAG Name' size='lg' onChange={handleChange} />
        <Button m="20px" colorScheme='blue' onClick={handleUpload}
          _hover={{
            bgGradient: 'linear(to-r, red.500, yellow.500)',
          }}>Submit</Button>
    </div>
      }
 
    </div>
    </Box>

  )
}

export default CustomUpload

