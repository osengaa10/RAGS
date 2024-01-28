import React from 'react';
import { Menu, Dropdown, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useAuthValue } from "../AuthContext";
import { axiosBaseUrl } from '../axiosBaseUrl';
import { useDisclosure, Heading } from '@chakra-ui/react';


const KnowledgeBaseDropdown = () => {
    const { isOpen, onOpen, onClose, onToggle } = useDisclosure();

    const { 
        setVectorDB,
        vectorDBList,
        setMessages,
        convoHistory,
        currentUser,
        setSystemPrompt
       } = useAuthValue()



    const handleSelectRAG = (vectorDB) => {
        setVectorDB(vectorDB);
        // Step 1: Filter the list
        const filteredRag = convoHistory.filter(item => item.rag === vectorDB);
        // Step 2: Sort the filtered list by 'created_at'
        const sortedRag = filteredRag.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        // Step 3: Transform into the desired format
        const convo = sortedRag.flatMap(item => [
            { text: item.prompt, sender: 'user' },
            { text: item.response, sender: 'llm', sources: item.sources, system_prompt: item.system_prompt }
        ]);
        axiosBaseUrl.post(`/rag_configs`, {user_id: currentUser.uid, input_directory: vectorDB})
          .then((response) => {
            setSystemPrompt(response.data)
        })
        setMessages(convo)

        onClose();
      };

    const menu = (
        <Menu>
            {vectorDBList.map((vDB) => (
            <Menu.Item key={vDB} onClick={() => handleSelectRAG(vDB)}>
                {vDB}
            </Menu.Item>
            ))}
        </Menu>
    );

    return (
        <>
        <Heading size="md" mr={2}>Chat with a knowledge base</Heading>
        <Dropdown overlay={menu}>
            <Button>
                Choose Knowledge Base <DownOutlined />
            </Button>
        </Dropdown>
        </>
    );
};

export default KnowledgeBaseDropdown;
