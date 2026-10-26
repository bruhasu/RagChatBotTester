import { Link, NavLink } from "react-router-dom";
import { tenant } from "../../tenantConfig.js";
import "./Navbar.css";

// "user" is the logged-in account ({ name, email }) from App.jsx.
export default function Navbar({ user, onLogout }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">
            <img src={tenant.logo} alt="" />
          </span>
          <span className="navbar-name">{tenant.name}</span>
        </Link>
        <nav className="navbar-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/chat">Chat</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
        {user && (
          <div className="navbar-user">
            <span className="navbar-user-name">Welcome, {user.name}</span>
            <button type="button" className="navbar-logout" onClick={onLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
