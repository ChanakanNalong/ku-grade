// src/App.js
import { useState } from "react";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const res = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    alert(data.message);
  };

  const handleLogin = async () => {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    alert(data.message);
    if (res.status === 200) {
      window.location.href = "/dashboard"; // redirect
    }
  };

  return (
    <div>
      <h1>Login/Register</h1>
      <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Username"/>
      <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password"/>
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default App;
