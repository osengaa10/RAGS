import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from '../firebase';
import { Spin, Menu, Drawer, Button } from 'antd';
import { DownOutlined, SettingOutlined, LogoutOutlined, MenuOutlined, MessageOutlined, UpOutlined } from '@ant-design/icons';

import { useAuthValue } from "../AuthContext";
import { axiosBaseUrl } from '../axiosBaseUrl';
import PrivacyLoader from "./PrivacyLoader";
import {Flex} from '@chakra-ui/react'

const { SubMenu, ItemGroup } = Menu;

const Header = (props) => {
    // const [current, setCurrent] = useState('h');
    const [isItemGroupCollapsed, setIsItemGroupCollapsed] = useState(false);

    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const {
        currentUser, 
        vectorDBList, 
        setSystemPrompt, 
        setMessages, 
        setVectorDB,
        convoHistory,
        setIsMobile,
        isMobile,
        runningRags,
        current,
        setCurrent
    } = useAuthValue();

    const onClick = (key) => {
        console.log('click ', key);
        setCurrent(key);
    };

    const handleLogout = () => {
        signOut(auth).then(() => {
            navigate("/login");
            console.log("Signed out successfully", auth);
        }).catch((error) => {
            // Handle error.
        });
    };

    const showDrawer = () => {
        setVisible(true);
    };

    const onClose = () => {
        setVisible(false);
    };

    const handleSelectRAG = (vectorDB) => {
        setVectorDB(vectorDB);
        // Step 1: Filter the list
        const filteredRag = convoHistory.filter(item => item.rag === vectorDB);
        // Step 2: Sort the filtered list by 'created_at'
        const sortedRag = filteredRag.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        // Step 3: Transform into the desired format
        const convo = sortedRag.flatMap(item => [
            { text: item.prompt, sender: 'user' },
            { text: item.response, sender: 'llm', sources: item.sources, system_prompt: item.system_prompt, page_numbers: item.page_numbers, document_names: item.document_names }
        ]);
        axiosBaseUrl.post(`/rag_configs`, {user_id: currentUser.uid, input_directory: vectorDB})
          .then((response) => {
            setSystemPrompt(response.data)
        })
        setMessages(convo)
        onClose();
      };

      const toggleItemGroup = () => {
        setIsItemGroupCollapsed(!isItemGroupCollapsed);
    };


    const renderMobileMenu = () => (
        <Menu onClick={onClick} selectedKeys={[current]} mode="inline" theme="light">
            <Menu.Item key="g1" onClick={toggleItemGroup}>
                Select knowledge base {isItemGroupCollapsed ? <DownOutlined /> : <UpOutlined />}
            </Menu.Item>
                     {!isItemGroupCollapsed && (
                <ItemGroup>
                    {runningRags.map((vDB) => (
                        <Menu.Item key={vDB} disabled>
                            <Spin size="small"/> &nbsp;
                               {vDB}
                        </Menu.Item>
                    ))}
                    {vectorDBList.map((vDB) => (
                        <Menu.Item key={vDB} onClick={() => handleSelectRAG(vDB)}>
                            <Link to="/" onClick={onClose}>{vDB}</Link>
                        </Menu.Item>
                    ))}
                </ItemGroup>
            )}
            <Menu.Item key="r" icon={<SettingOutlined />} >
                <Link to="/custom" onClick={onClose}>Edit Knowledge Bases</Link>
            </Menu.Item>
            <Menu.Item key="m" onClick={handleLogout} icon={<LogoutOutlined />} >
                Logout {props.displayName}
            </Menu.Item>
        </Menu>
    );

    const renderDesktopMenu = () => (
        <Menu onClick={onClick} selectedKeys={[current]} mode={isMobile ? "vertical" : "horizontal"} theme="light">
            <SubMenu key="h" icon={<MessageOutlined />} title={<Link to="/" onClick={(e) => { e.preventDefault(); onClick('h'); }}>Chat</Link>}>
            {runningRags.map((vDB) => (
                        <Menu.Item key={vDB} disabled>
                            <Spin size="small"/> &nbsp;
                               {vDB}
                        </Menu.Item>
                    ))}
                {vectorDBList.map((vDB) => (
                    <Menu.Item key={vDB} onClick={() => handleSelectRAG(vDB)}>
                        <Link to="/" onClick={onClose}>{vDB}</Link>
                    </Menu.Item>
                ))}
            </SubMenu>
            <Menu.Item key="r" icon={<SettingOutlined />} >
                <Link to="/custom" onClick={onClose}>Edit Knowledge Bases</Link>
            </Menu.Item>
            <Menu.Item key="m" onClick={handleLogout} icon={<LogoutOutlined />} >
                Logout {props.displayName}
            </Menu.Item>
        </Menu>
    );

    return (
        <>
            {isMobile ? (
                <>
                    <Button type="primary" onClick={showDrawer} icon={<MenuOutlined />} style={{ position: 'fixed', zIndex: 1, top: 16, left: 16 }} />
                    <Drawer title="Menu" placement="left" onClose={onClose} visible={visible}>
                        {renderMobileMenu()}
                    </Drawer>
                </>
            ) : (
                renderDesktopMenu()
            )}
            <Outlet />
        </>
    );
};

export default Header;
