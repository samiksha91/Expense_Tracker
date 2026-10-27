import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/expenses", label: "Expenses" },
  { to: "/categories", label: "Categories" },
  { to: "/reports", label: "Reports" },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar-inner">
          <span className="brand">Expense Tracker</span>
          <nav className="nav-links">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="user-menu">
            <span className="muted">{user?.name}</span>
            <button className="btn btn-ghost" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="page-container">
        <Outlet />
      </main>

      <footer className="demo-note">Expense Tracker</footer>
    </div>
  );
}
