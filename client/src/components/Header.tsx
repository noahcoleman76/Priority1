import { Link } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";

export const Header = () => {
  const { logout } = useAuth();

  return (
    <header className="app-header">
      <Link to="/" className="brand">
        Priority1
      </Link>
      <nav className="header-actions">
        <Link to="/settings" className="icon-link" aria-label="Settings">
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        <button className="icon-button" onClick={logout} aria-label="Log out">
          <LogOut size={18} />
        </button>
      </nav>
    </header>
  );
};
