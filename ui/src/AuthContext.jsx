import React, {useContext} from 'react'

const AuthContext = React.createContext()

export function AuthProvider({children, value}) {

  // const [userSession, setUserSession] = useState("this is some global state");

  // const value = {
  //   userSession,
  //   setUserSession, // Provide a way to update the userSession
  // };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthValue(){
  return useContext(AuthContext)
}