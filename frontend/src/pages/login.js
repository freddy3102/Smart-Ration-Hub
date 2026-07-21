import { useState } from "react";
import axios from "axios";
function Login({ setLoggedIn })  {
    const [username, setUsername] = useState("");
const [password, setPassword] = useState("");

const handleLogin = async () => {

    try {

        const response = await axios.post(
            "http://127.0.0.1:5000/login",
            {
                username: username,
                password: password
            }
        );

        if (response.data.message === "Login successful") {
            setLoggedIn(true);
            } 
        else {
            alert(response.data.message);
        }

    } catch (error) {

        if (error.response) {
            alert(error.response.data.message);
        } else {
            alert("Unable to connect to server");
        }

    }

};

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f4f4f4"
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
          width: "350px"
        }}
      >
        <h2 style={{ textAlign: "center" }}>🍚 Smart Ration Hub</h2>

        <input
    type="text"
    placeholder="Username"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    style={{
        width: "100%",
        padding: "10px",
        marginTop: "20px"
    }}
/>

        <input
    type="password"
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    style={{
        width: "100%",
        padding: "10px",
        marginTop: "15px"
    }}
/>

        <button onClick={handleLogin}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Login;