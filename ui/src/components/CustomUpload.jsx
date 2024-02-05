import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './CustomUpload.css';
import { axiosBaseUrl } from '../axiosBaseUrl';
import {
  Box,
  Text,
  Flex,
  useBreakpointValue,
  IconButton,
  Textarea,
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
  Tooltip,
  PopoverFooter
} from '@chakra-ui/react';
import { 
  InboxOutlined, 
  InfoCircleOutlined, 
  CloudSyncOutlined, 
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  
} from '@ant-design/icons';
import { Upload, AutoComplete, Button } from 'antd';
import { useAuthValue } from "../AuthContext";
import Loader from "./Loader";
import PDFViewerModal from './PDFViewerModal';
import SystemPromptExampleModal from './SystemPromptExampleModal';
import * as pdfjsLib from 'pdfjs-dist';

let pdfjs;
let pdfjsWorker;

async function pdf() {
    pdfjs = await import('pdfjs-dist/build/pdf');
    pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}
const { Dragger } = Upload;

function CustomUpload() {
    pdf()
  const [ragName, setRagName] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false)
  const [selectedOption, setSelectedOption] = useState('');
  const [searchedValue, setSearchedValue] = useState('');
  const [uploadTimeEstimate, setUploadTimeEstimate] = useState(null)
  const [sourceFiles, setSourceFiles] = useState([]);
  const [pdfFileBlob, setPdfFileBlob] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileName, setFileName] = useState(null);  

  
  let navigate = useNavigate();
  const inputWidth = useBreakpointValue({ base: '100%', md: '100%' });

  const { 
    currentUser, 
    isPrivacyMode,
    vectorDBList,
    setVectorDBList,
    systemPrompt,
    setSystemPrompt
   } = useAuthValue()

   const [revertSystemPrompt, setRevertSystemPrompt] = useState(systemPrompt);

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

  const handleBlur = () => {
    if (systemPrompt.trim() === '') {
      setSystemPrompt(revertSystemPrompt);
      console.log("systemPrompt:: ", systemPrompt)
      console.log("revertSystemPrompt:: ", revertSystemPrompt)

    }
  };

  const handleChange = (e) => {
    setSystemPrompt(e.target.value);
  };

  
  
  let props = {
    name: 'file',
    multiple: true,
    customRequest: dummyRequest,
    status: 'done',
    accept:'application/pdf',
    // onChange (e) {
    //   let files = (e.fileList).map(object => object.originFileObj)
    //   let fileSize = (e.fileList).map(object => object.size);
    //   setSelectedFiles(files);
    //   let totalSize = 0;
    //   totalSize = fileSize.reduce((sum, number) => {
    //     return sum + number;
    //   }, 0)
    //   console.log("totalSize::: ", totalSize/(1024 * 1024))
    //   setUploadTimeEstimate(Math.round((totalSize/(1024 * 1024)*10)/60))
    //   const sizeLimit = 500 * 1024 * 1024; // 500MB in bytes
    // },

    onChange (e) {
        let files = e.fileList.map(object => object.originFileObj);
        setSelectedFiles(files);
      
        // Wrap the page count in a Promise to use with Promise.all
        const pageCountPromises = files.map(file => {
          return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = async (event) => {
              const typedArray = new Uint8Array(event.target.result);
              try {
                const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
                console.log(`Number of Pages in file ${file.name}: `, pdf.numPages);
                resolve(pdf.numPages); // Resolve the promise with the number of pages
              } catch (error) {
                console.error("Error reading PDF file:", error);
                reject(error); // Reject the promise in case of an error
              }
            };
            fileReader.readAsArrayBuffer(file);
          });
        });
      
        // Wait for all the promises to resolve and then sum up the total number of pages
        Promise.all(pageCountPromises).then(pageCounts => {
          const totalNumPages = pageCounts.reduce((acc, pageCount) => acc + pageCount, 0);
          setUploadTimeEstimate(Math.round((totalNumPages * 1.25) / 60));
        }).catch(error => {
          // Handle any error that occurred during reading any of the files
          console.error("An error occurred processing the files", error);
        });
      },
      
      onDrop(e) {
        console.log('Dropped files', e.dataTransfer.files);
      },
      
  };

   const fetchDatabases = () => {
    axiosBaseUrl.get(`/databases/${currentUser.uid}`)
      .then((response) =>{
        setVectorDBList(response.data)
        setSystemPrompt('')
      })
   }

  const onSelect = (data,option) => {
    setSelectedOption(option);
    setRagName(option.label)
    setSearchedValue(option.label);
    axiosBaseUrl.post(`/rag_configs`, {user_id: currentUser.uid, input_directory: option.label})
      .then((response) => {
        setSystemPrompt(response.data)
        setRevertSystemPrompt(response.data)
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
    setSelectedOption(option);
    setSystemPrompt('')
    setSourceFiles([])
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
        if (ragName !=='' && !isPrivacyMode) {
            axiosBaseUrl.post('/save_rag_config', {uid: currentUser.uid, input_directory: ragName, system_prompt: systemPrompt})
                .then((response) => {
                    console.log("saved the following system prompt:: ", systemPrompt);
            })
        } 
        
        if (selectedFiles.length !== 0 && ragName !== '') {
            setUploading(true)
            const formData = new FormData();
            selectedFiles.forEach((file, index) => {
                // Create a new File object with a sanitized name
                const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/['",]/g, "");
                const sanitizedFile = new File([file], sanitizedFileName, { type: file.type });
        
                formData.append(`files`, sanitizedFile);
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
        setSourceFiles([])
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
      bg="#fffff8"
      p={useBreakpointValue({ base: 4, md: 1 })}
    >
      <VStack spacing={useBreakpointValue({ base: 4, md: 6 })} align="stretch">
      <Text
          color='gray.700'
          fontSize={useBreakpointValue({ base: 'xl', md: '2xl' })}
          textAlign='center'
          paddingTop={useBreakpointValue({ base: '0', md: '15px' })}
        >
          Create/Edit knowledge base
        </Text>

        <Flex justifyContent="center" alignItems="center">
          <AutoComplete
            value={searchedValue}
            options={options}
            placeholder="knowledge base"
            style={{width: 400}}
            filterOption={(searchedValue, option) => 
              option.label.toUpperCase().indexOf(searchedValue.toUpperCase()) !== -1
            }
            onSelect={onSelect}
            onChange={onChange}
          />
          
        </Flex>
            {isPrivacyMode ?
            <></>
            :
            <Flex justifyContent="center" alignItems="center">
            <Textarea
              placeholder="System prompt..."
              value={systemPrompt}
              // onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleChange}
              style={{ width: inputWidth }} 
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
            }

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
            {isPrivacyMode ?
            <Text
            color='gray.700'
            fontSize='l'
            mr={4}
          >
            Privacy mode accounts do not store files
          </Text>
          :
          <Text
            color='gray.700'
            fontSize='l'
            mr={4}
          >
            Knowledge base files:
          </Text>

            }
        
          {sourceFiles.map((file, index) => (
            <>
            <VStack key={index} justify="space-between">
                <Text style={{
                // maxWidth: '60vw', // Ensures the text container doesn't exceed the parent's width
                overflowWrap: 'break-word', // Allow long words to break and wrap onto the next line
                wordBreak: 'break-word', // Use this for better cross-browser support
                textAlign: 'left'
                }}>
                    {file}
                </Text>
              <Tooltip title="search">
              <Button
               type="primary"
               icon={<EyeOutlined />}
               onClick={() => handleDownload(file)}
             >
               View PDF
             </Button>
             </Tooltip>
            </VStack>
             <Divider />
             </>
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