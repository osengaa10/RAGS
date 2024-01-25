import React, {useContext,useState} from 'react'

const AuthContext = React.createContext()

export function AuthProvider({children, value}) {

  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const contextValue = {
    ...value,
    isPrivacyMode,
    setIsPrivacyMode
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