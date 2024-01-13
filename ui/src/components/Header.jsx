import { HomeTwoTone, CloudUploadOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import {  signOut } from "firebase/auth";
import {auth} from '../firebase';
import { useNavigate } from 'react-router-dom';

const Header = (props) => {
  const [current, setCurrent] = useState('h');
  const onClick = (e) => {
    console.log('click ', e);
    setCurrent(e.key);
  };

  const navigate = useNavigate();
  const handleLogout = () => {               
      signOut(auth).then(() => {
      // Sign-out successful.
          navigate("/login");
          console.log("Signed out successfully", auth)
      }).catch((error) => {
      // An error happened.
      });
  }
  return (
    <>
        <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" theme="light">
            <Menu.Item key="h" icon= {<HomeTwoTone />}>
                <Link to="/">Home</Link>
            </Menu.Item>
            <Menu.Item key="r" icon= {<CloudUploadOutlined />} >
                <Link to="/custom">My Knowledge bases</Link>
            </Menu.Item>
            <Menu.Item key="l" icon= {<SettingOutlined />} >
                <Link to="/">RAG & LLM Configs</Link>
            </Menu.Item>
            <Menu.Item onClick={handleLogout} key="m" style={{ marginLeft: 'auto' }} icon= {<LogoutOutlined />} >
                <Link to="/login">Logout {props.displayName}</Link>
            </Menu.Item>
        </Menu>
        <Outlet />
    </>
  )
};
export default Header;