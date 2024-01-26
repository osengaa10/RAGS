import { useState, useEffect } from 'react';
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import CustomUpload from './components/CustomUpload';
import Home from './components/Home';
import Signup from './components/Signup';
import Login from './components/Login';
import { auth } from './firebase';
import { AuthProvider, useAuthValue } from './AuthContext';
import { onAuthStateChanged } from 'firebase/auth';
import Loader from './components/Loader';
import { axiosBaseUrl } from './axiosBaseUrl';
// const { isPrivacyMode, setIsPrivacyMode } = useAuthValue()

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("before onAuthStateChanged")
    onAuthStateChanged(auth, (user) => {
      console.log("user inside onAuthStateChanged::: ", user)
      setCurrentUser(user);
      setIsLoading(false);
    });    
    console.log("after onAuthStateChanged")
  }, []);

  // if (isLoading) {
  //   return <Loader />;
  // }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout currentUser={currentUser} />}>
        <Route index element={<ProtectedRoute currentUser={currentUser}><Home /></ProtectedRoute>} />
        <Route path="custom" element={<ProtectedRoute currentUser={currentUser}><CustomUpload /></ProtectedRoute>} />
        <Route path="/signup" element={currentUser ? <Navigate to="/" /> : <Signup />} />
        <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login />} />
      </Route>
    )
  );

  return (
    <AuthProvider value={{ currentUser }}>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

function Layout({ currentUser }) {
  return (
    <>
      {currentUser ? <Header displayName={currentUser.email} />
      : <Outlet />
    }
      
    </>
  );
}

function ProtectedRoute({ currentUser, children }) {
  return currentUser ? children : <Navigate to="/login" />;
}

export default App;