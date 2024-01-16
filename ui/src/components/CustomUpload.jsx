import { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";

import Home from './Home';
import './CustomUpload.css'
import { axiosBaseUrl } from '../axiosBaseUrl'
import {
  Box,
  Input,
  keyframes,
  Spinner,
  Text
} from '@chakra-ui/react'
import { AutoComplete, Button } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
import { useAuthValue } from "../AuthContext"
const { Dragger } = Upload;

function CustomUpload() {
  const [ragName, setRagName] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false)

  const [gradients, setGradients] = useState('radial(gray.300, yellow.400, pink.200)')
  const [vectorDBList, setVectorDBList] = useState([])
  const [selectedOption, setSelectedOption] = useState('');
  const [searchedValue, setSearchedValue] = useState('');
  const [uploadTimeEstimate, setUploadTimeEstimate] = useState(null)
  let navigate = useNavigate();
  const {currentUser} = useAuthValue()


  const options = vectorDBList.map((item, index) => {
    return { label: item, value: String(index + 1) };
});

  const dummyRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };
  useEffect(() => {
    fetchDatabases()
  },[])
  
  let props = {
    name: 'file',
    multiple: true,
    customRequest: dummyRequest,
    status: 'done',
    accept:'application/pdf',
    onChange (e) {
      // console.log("e:::: ", e.file.originFileObj)
      // const files = e.file.originFileObj
      let files = (e.fileList).map(object => object.originFileObj)
      // let fileNames = (e.fileList).map(object => object.name);
      let fileSize = (e.fileList).map(object => object.size);
      setSelectedFiles(files);
      // console.log("selectedFiles dragNdrop::: ", [...selectedFiles, ...file])
      let totalSize = 0;
      totalSize = fileSize.reduce((sum, number) => {
        return sum + number;
      }, 0)
      console.log("totalSize::: ", totalSize/(1024 * 1024))
      setUploadTimeEstimate(Math.round((totalSize/(1024 * 1024)*10)/60))
      const sizeLimit = 500 * 1024 * 1024; // 500MB in bytes
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };


  const animation = keyframes `
  to {
     background-position: 200%;
   }
`
   const fetchDatabases = () => {
    axiosBaseUrl.get(`/databases/${currentUser.uid}`)
      .then((response) =>{
        setVectorDBList(response.data)
      })
   }

  // const handleFileChange = (e) => {
  //   const files = e.target.files;
  //   setSelectedFiles([...selectedFiles, ...files]);
  //   console.log("selectedFiles button::: ", [...selectedFiles, ...files])
  //   let totalSize = 0;
  //   for (let key in files) {
  //     if (files.hasOwnProperty(key)) {
  //       totalSize += files[key].size;
  //     }
  //   }
  //   console.log("totalSize::: ", totalSize/(1024 * 1024))
  //   setUploadTimeEstimate(Math.round((totalSize/(1024 * 1024)*10)/60))
  //   const sizeLimit = 500 * 1024 * 1024; // 500MB in bytes
  // };



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
    axiosBaseUrl.post('/chunk_and_embed', formData)
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


  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${ragName}?`)) {
      // Save it!
      axiosBaseUrl.post('/delete', {user_id: currentUser.uid, input_directory: ragName})
      .then(response => {
        setSearchedValue('')
      fetchDatabases()
      })
      .catch(error => {
        console.log("Error Deleting directory: ", error)
    })
    } else {
      console.log(`${ragName} not deleted.`);
    }
    
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
        fontSize='4xl'
        fontWeight='extrabold'
      >
        Custom File Q&A
      </Text> 
      
      <div>
        {/* <input style={{padding: '20px'}} type="file" accept=".pdf" onChange={handleFileChange} multiple/> */}
        <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single or bulk upload.
          </p>
        </Dragger>
        <AutoComplete
          value={searchedValue}
          options={options}
          autoFocus={false}
          style={{width: 200}}
          placeholder="knowledge base"
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
        : 
        <>
        <Button style={{margin: '5px'}} onClick={() => handleUpload()} type="primary">
        Submit
        </Button> 
        {ragName ?
          <Button type="primary" style={{marginRight: '5px'}} onClick={() => handleDelete()} danger>
          Delete
          </Button>
        :
        <></>
        }
        </>
      
      }
        
      </div>
    </div>
    <br />
    { selectedFiles.length > 0 ?
      <Text as='i'>*Estimated Time: {uploadTimeEstimate} mintue(s). This only needs to be done once.</Text>
      :
      <></>
    }
  
    </Box>

  )
}

export default CustomUpload

