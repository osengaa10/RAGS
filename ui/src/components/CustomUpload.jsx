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
  // Button,
  VStack,
  HStack,
  Divider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Tooltip
} from '@chakra-ui/react';
import { 
  InboxOutlined, 
  DownloadOutlined, 
  InfoCircleOutlined, 
  CloudSyncOutlined, 
  CloudUploadOutlined, 
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Upload, AutoComplete, Button } from 'antd';
import { useAuthValue } from "../AuthContext";
import Loader from "./Loader";
import PDFViewerModal from './PDFViewerModal'; // Adjust the import path as needed
const { Dragger } = Upload;

function CustomUpload() {
  const [ragName, setRagName] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false)
  const [gradients, setGradients] = useState('radial(gray.100, gray.200, gray.300)')
  // const [vectorDBList, setVectorDBList] = useState([])
  const [selectedOption, setSelectedOption] = useState('');
  const [searchedValue, setSearchedValue] = useState('');
  const [uploadTimeEstimate, setUploadTimeEstimate] = useState(null)
  const [sourceFiles, setSourceFiles] = useState([]);
  const [pdfFileBlob, setPdfFileBlob] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileName, setFileName] = useState(null);
  // const [systemPrompt, setSystemPrompt] = useState('');
  const [ragConfigs, setRagConfigs] = useState()
  let navigate = useNavigate();
  const { 
    currentUser, 
    isPrivacyMode,
    setIsPrivacyMode,
    vectorDBList,
    setVectorDBList,
    vectorDB,
    setVectorDB,
    messages,
    setMessages,
    convoHistory,
    setConvoHistory,
    systemPrompt,
    setSystemPrompt
   } = useAuthValue()

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

   const fetchDatabases = () => {
    axiosBaseUrl.get(`/databases/${currentUser.uid}`)
      .then((response) =>{
        setVectorDBList(response.data)
      })
   }

  const onSelect = (option) => {
    setSelectedOption(option);
    setRagName(option.label)
    setSearchedValue(option.label);
    setVectorDB(option.label)
    axiosBaseUrl.post(`/rag_configs`, {user_id: currentUser.uid, input_directory: option.label})
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
    if (selectedFiles.length === 0 && ragName !=='' && !isPrivacyMode) {
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
      formData.append(`is_privacy`, isPrivacyMode)
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
      bg="#fffff8"
      p={useBreakpointValue({ base: 4, md: 10 })}
    >
      <VStack spacing={useBreakpointValue({ base: 4, md: 6 })} align="stretch">
      <Text
          color='gray.700'
          fontSize={useBreakpointValue({ base: 'xl', md: '2xl' })}
          // fontWeight='bold'
          textAlign='center'
          paddingTop={useBreakpointValue({ base: '0', md: '15px' })}
        >
          Create/Edit knowledge base
        </Text>

        <Flex justifyContent="center" alignItems="center">
          <Text
            color='gray.700'
            fontSize='l'
            // fontWeight='semibold'
            mr={4}
          >
            Select knowledge base:
          </Text>
          <AutoComplete
            value={searchedValue}
            options={options}
            placeholder="knowledge base"
            // onChange={(e) => setSearchedValue(e.target.value)}
            style={{width: 400}}
            filterOption={(searchedValue, option) => 
              option.label.toUpperCase().indexOf(searchedValue.toUpperCase()) !== -1
            }
            onSelect={onSelect}
            onChange={onChange}
          />
          
        </Flex>

        <Flex justifyContent="center" alignItems="center">
          <Textarea
            placeholder="System prompt..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            size='lg'
          />
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
            </PopoverContent>
          </Popover>
        </Flex>

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

               {vectorDBList.includes(ragName) ? 
               <>
              
              <Button
                type="primary"
                icon={<CloudSyncOutlined />}
                onClick={handleUpload}
              >
                Update
              </Button>
              <Button
                type="primary"
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                danger
              >
                Delete
              </Button>
            </>
               : 
               <Button
               type="primary"
               icon={<PlusOutlined />}
               onClick={handleUpload}
             >
               Create
             </Button>
               }
        
          </HStack>
        )}

        {selectedFiles.length > 0 && (
          <Text as='i'>
            *Estimated Time: {uploadTimeEstimate} minute(s). This only needs to be done once.
          </Text>
        )}

        <Divider />

        <VStack spacing={4}>
        <Text
            color='gray.700'
            fontSize='l'
            // fontWeight='semibold'
            mr={4}
          >
            Knowledge base files:
          </Text>
          {sourceFiles.map((file, index) => (
            <HStack key={index} justify="space-between">
              <Text isTruncated>{file}</Text>
              <Tooltip title="search">
              <Button
               type="primary"
               icon={<EyeOutlined />}
               onClick={() => handleDownload(file)}
             >
               View PDF
             </Button>
             </Tooltip>
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