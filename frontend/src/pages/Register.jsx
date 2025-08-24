// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const { name, email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', formData);
            setMessage(res.data.message);
            // ถ้าสำเร็จ ให้ไปหน้า login หลังจาก 2 วินาที
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setMessage(err.response.data.message);
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={onSubmit}>
                <div>
                    <input
                        type="text"
                        placeholder="Name"
                        name="name"
                        value={name}
                        onChange={onChange}
                        required
                    />
                </div>
                <div>
                    <input
                        type="email"
                        placeholder="Email Address"
                        name="email"
                        value={email}
                        onChange={onChange}
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        name="password"
                        value={password}
                        onChange={onChange}
                        minLength="6"
                        required
                    />
                </div>
                <input type="submit" value="Register" />
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Register;