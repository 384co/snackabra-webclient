/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SafeAreaView } from 'react-native-safe-area-context';
import Rooms from './pages/Rooms';
import NavAppBar from "./components/NavAppBar";

const AppRoutes = () => {

  return (
    <SafeAreaView>
      <BrowserRouter>
        <NavAppBar />
        <Routes>
          <Route path='/' element={<Rooms />} />
          <Route path='/r/:room_id' element={<Rooms />} />
          <Route path='/r/:room_id/admin' element={<Rooms />} />
          <Route path='/w/:wallet_id' />
        </Routes>
      </BrowserRouter>
    </SafeAreaView>
  )
}

export default AppRoutes
