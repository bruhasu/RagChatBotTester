import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar.jsx";
import Footer from "./components/Footer/Footer.jsx";
import Home from "./pages/Home/Home.jsx";
import Chat from "./pages/Chat/Chat.jsx";
import About from "./pages/About/About.jsx";
import Login from "./pages/Login/Login.jsx";
import Signup from "./pages/Signup/Signup.jsx";
import { getCurrentUser, logout } from "./authService.js";
import "./App.css";

// Every page shares the same Navbar on top and Footer at the bottom.
// Nobody sees the site (Home, Chat, About) until they log in.
export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still asking the backend, null = logged out
  const navigate = useNavigate();

  // On page load, ask the backend whether the login cookie is still valid.
  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  function handleLogin(newUser) {
    setUser(newUser);
    navigate("/", { replace: true });
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    navigate("/login", { replace: true });
  }

  if (user === undefined) {
    return (
      <div className="app">
        <main className="app-main">
          <p role="status">Loading…</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Not logged in: only Login and Signup exist. Any other address (like /chat) goes to /login.
  if (!user) {
    return (
      <div className="app">
        <main className="app-main">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Home user={user} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
