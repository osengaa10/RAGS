import { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";

import Home from './Home';
import './CustomUpload.css'
import axios from 'axios'
import {
  Box,
  Input,
  keyframes,
  Spinner,
  Text
} from '@chakra-ui/react'
import { AutoComplete, Button } from 'antd';
import PromptAndResponse from './PrompAndResponse'
import { useAuthValue } from "../AuthContext"

function CustomUpload() {
  const [ragName, setRagName] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false)

  const [gradients, setGradients] = useState('radial(gray.300, yellow.400, pink.200)')
  const [vectorDBList, setVectorDBList] = useState([])
  const [setFilteredRAGs, filteredRAGs] = useState([])
  const [selectedOption, setSelectedOption] = useState('');
  const [searchedValue, setSearchedValue] = useState('');
  let navigate = useNavigate();
  const {currentUser} = useAuthValue()


  const options = vectorDBList.map((item, index) => {
    return { label: item, value: String(index + 1) };
});

  useEffect(() => {
    axios.get(`http://localhost:8000/databases/${currentUser.uid}`)
      .then((response) =>{
        setVectorDBList(response.data)
      })
  },[])


  const animation = keyframes `
  to {
     background-position: 200%;
   }
`

  const handleFileChange = (e) => {
    const files = e.target.files;
    setSelectedFiles([...selectedFiles, ...files]);
  };



  const onSelect = (data, option) => {
    setSelectedOption(option);
    setRagName(option.label)
    setSearchedValue(option.label);
  };

  const onChange = (data, option) => {
    setSearchedValue(data);
    setRagName(data)
    setSelectedOption(option); // to remove selected option when user types  something wich doesn't match with any option
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0 || ragName === '') {
      alert('Select one or more files and name your RAG');
      return;
    }
    setUploading(true)
    const formData = new FormData();
        selectedFiles.forEach((file, index) => {
      formData.append(`files`, file);
    });
    formData.append(`input_directory`, ragName)
    formData.append(`user_id`, currentUser.uid)
    axios.post('http://localhost:8000/chunk_and_embed', formData)
    .then(response => {
      // Handle the response from the server
      setUploading(false)
      navigate("/");
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
      
      <div>
        <input style={{padding: '20px'}} type="file" accept=".pdf" onChange={handleFileChange} multiple/>
        <AutoComplete
          value={searchedValue}
          options={options}
          autoFocus={true}
          style={{width: 200}}
          filterOption={(searchedValue, option) =>
            option.label.toUpperCase().indexOf(searchedValue.toUpperCase()) !== -1
          }
          onSelect={onSelect}
          onChange={onChange}
        />
        {uploading ? 
        <Spinner
          thickness='4px'
          speed='0.65s'
          emptyColor='green.200'
          color='pink.500'
          size='xl'
        /> 
        : <Button onClick={() => handleUpload()} type="primary">
        Submit
        </Button> }
        
      </div>
    </div>
    </Box>

  )
}

export default CustomUpload

