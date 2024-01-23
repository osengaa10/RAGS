import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { saveAs } from 'file-saver'; // You might need to install file-saver package

import './CustomUpload.css';
import { axiosBaseUrl } from '../axiosBaseUrl';
import {
  Box,
  keyframes,
  Text,
  Flex,
  useBreakpointValue,
  IconButton,
  Input,
  Textarea,
  Button,
  VStack,
  HStack,
  Divider
} from '@chakra-ui/react';
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import { Upload, AutoComplete } from 'antd';
import { useAuthValue } from "../AuthContext";
import Loader from "./Loader";
import PDFViewerModal from './PDFViewerModal'; // Adjust the import path as needed

const { Dragger } = Upload;

function CustomUpload() {
  const [ragName, setRagName] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false)
  const [gradients, setGradients] = useState('radial(gray.100, gray.200, gray.300)')
  const [vectorDBList, setVectorDBList] = useState([])
  const [selectedOption, setSelectedOption] = useState('');
  const [searchedValue, setSearchedValue] = useState('');
  const [uploadTimeEstimate, setUploadTimeEstimate] = useState(null)
  const [sourceFiles, setSourceFiles] = useState([]);
  const [pdfFileBlob, setPdfFileBlob] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [ragConfigs, setRagConfigs] = useState()
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
      let files = (e.fileList).map(object => object.originFileObj)
      let fileSize = (e.fileList).map(object => object.size);
      setSelectedFiles(files);
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

  const isMobile = useBreakpointValue({ base: true, md: false });

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

  const onSelect = (data, option) => {
    setSelectedOption(option);
    setRagName(option.label)
    setSearchedValue(option.label);
    axiosBaseUrl.post(`/rag_configs/`, {user_id: currentUser.uid, input_directory: option.label})
      .then((response) => {
        setSystemPrompt(response.data)
      })
    axiosBaseUrl.get(`/sourcefiles/${currentUser.uid}/${option.label}`)
      .then((response) => {
        setSourceFiles(response.data);
        console.log(`sourceFiles::: ${response.data}`)
      })
  };

  const onChange = (data, option) => {
    setSearchedValue(data);
    setRagName(data)
    setSelectedOption(option); // to remove selected option when user types  something wich doesn't match with any option
  };


  const handleDownload = (fileName) => {
    axiosBaseUrl.get(`/download/${currentUser.uid}/${ragName}/${fileName}`, {
      responseType: 'blob',
    })
    .then((response) => {
      // Create a new Blob object using the response data of the file
      const fileBlob = new Blob([response.data], { type: 'application/pdf' });
      // Use file-saver to save the blob as a file
      // saveAs(fileBlob, fileName);
      setPdfFileBlob(fileBlob)
      setIsModalOpen(true);
      setFileName(fileName);
      console.log("Downloaded ", fileName);
    })
    .catch((error) => {
      console.error('Error downloading file:', error);
    });
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0 || ragName === '') {
      axiosBaseUrl.post('/save_rag_config', {uid: currentUser.uid, input_directory: ragName, system_prompt: systemPrompt})
        .then((response) => {
          console.log("saved the following system prompt:: ", systemPrompt);
        })
      return;
    } else {
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
        setUploading(false)
      });
    }

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
      overflow='auto'
      bgGradient='linear(to-r, blue.200, pink.200)'
      p={10}
    >
      <VStack spacing={6} align="stretch">
        <Text
          color='gray.700'
          fontSize='3xl'
          fontWeight='bold'
          textAlign='center'
        >
          Custom File Q&A
        </Text>

        <Flex justifyContent="center" alignItems="center">
          <Text
            color='gray.700'
            fontSize='xl'
            fontWeight='semibold'
            mr={4}
          >
            Select knowledge base:
          </Text>
          <AutoComplete
            value={searchedValue}
            options={options}
            placeholder="knowledge base"
            // onChange={(e) => setSearchedValue(e.target.value)}
            style={{width: 200}}
            filterOption={(searchedValue, option) => 
              option.label.toUpperCase().indexOf(searchedValue.toUpperCase()) !== -1
            }
            onSelect={onSelect}
            onChange={onChange}
          />
          
        </Flex>

        <Textarea
          placeholder="System prompt..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          size='lg'
        />

        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single or bulk upload.
          </p>
        </Dragger>

        {uploading ? <Loader /> : (
          <HStack spacing={4}>
            <Button
              onClick={handleUpload}
              colorScheme='blue'
              leftIcon={<DownloadOutlined />}
            >
              Submit
            </Button>
            {ragName && (
              <Button
                onClick={handleDelete}
                colorScheme='red'
              >
                Delete
              </Button>
            )}
          </HStack>
        )}

        {selectedFiles.length > 0 && (
          <Text as='i'>
            *Estimated Time: {uploadTimeEstimate} minute(s). This only needs to be done once.
          </Text>
        )}

        <Divider />

        <VStack spacing={4}>
          <Text fontWeight='bold'>Knowledge base files</Text>
          {sourceFiles.map((file, index) => (
            <HStack key={index} justify="space-between">
              <Text isTruncated>{file}</Text>
              <Button onClick={() => handleDownload(file)} colorScheme='teal'>
                View PDF
              </Button>
            </HStack>
          ))}
          {pdfFileBlob && (
            <PDFViewerModal
              pdfBlob={pdfFileBlob}
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              fileName={fileName}
            />
          )}
        </VStack>
      </VStack>
    </Box>
  )
}

export default CustomUpload