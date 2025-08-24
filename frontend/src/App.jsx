// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <div>
      <nav>
        <ul>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/register">Register</Link></li>
        </ul>
      </nav>
      <hr />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* คุณสามารถเพิ่ม Route หน้าหลักได้ที่นี่ */}
        <Route path="/" element={<h2>Home Page</h2>} />
      </Routes>
    </div>
  );
}

export default App;