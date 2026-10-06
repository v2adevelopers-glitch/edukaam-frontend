import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoadingBarContainer } from 'react-top-loading-bar';
import './App.css';
import { DContext } from './context/DContext';
import UserLayout from './layouts/UserLayout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Homepage from './pages/HomePage';
import Profile from './pages/profile/Profile';
import Job from './pages/jobs/Job';
import Application from './pages/applications/Application';
import Opening from './pages/openings/Opening';
import MyApplication from './pages/my-applications/MyApplication';

const App = () => {
  const { authState } = useContext(DContext);
  const { isLoggedIn, authLoading } = authState;

  return (
    <LoadingBarContainer>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 13 } }} />
      {authLoading ? null : !isLoggedIn ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<UserLayout />}>
            <Route path="" element={<Homepage />} />
            <Route path="profile/:method" element={<Profile />} />
            <Route path="jobs/:method" element={<Job />} />
            <Route path="applications/:method" element={<Application />} />
            <Route path="openings/:method" element={<Opening />} />
            <Route path="my-applications/:method" element={<MyApplication />} />
            <Route path="*" element={<Navigate to="" replace />} />
          </Route>
        </Routes>
      )}
    </LoadingBarContainer>
  );
};

export default App;
