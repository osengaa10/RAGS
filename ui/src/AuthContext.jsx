import React, {useContext,useState} from 'react'

const AuthContext = React.createContext()

export function AuthProvider({children, value}) {

  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [vectorDBList, setVectorDBList] = useState([]);
  const [vectorDB, setVectorDB] = useState('');
  const [messages, setMessages] = useState([]);
  const [convoHistory, setConvoHistory] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [reRender, setReRender] = useState(false);


  const contextValue = {
    ...value,
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
    setSystemPrompt,
    isMobile,
    setIsMobile,
    reRender,
    setReRender,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthValue(){
  return useContext(AuthContext)
}