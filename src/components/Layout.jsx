import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, RefreshCw, Menu, X, Box, UserCheck, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin, logout } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/items', label: 'Barang Kantor', icon: Package },
    { to: '/borrowings', label: 'Peminjaman', icon: RefreshCw },
  ];

  if (isAdmin) {
    navItems.push({ to: '/admin/users', label: 'Kelola User', icon: UserCheck });
  } else {
    navItems.push({ to: '/login', label: 'Login Admin', icon: LogIn });
  }


  return (
    <div className={styles.container}>
      {/* Mobile Top Bar */}
      <header className={`glass ${styles.mobileHeader}`}>
        <button className={styles.menuBtn} onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <Link to="/" className={styles.logoRow}>
          <Box size={24} className={styles.logoIcon} />
          <span className={styles.logoText}>SimJam Barang</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Sidebar navigation */}
      <aside className={`glass ${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.logoRow} onClick={() => setSidebarOpen(false)}>
            <Box size={28} className={styles.logoIcon} />
            <span className={styles.logoText}>SimJam Barang</span>
          </Link>
          <button className={styles.closeBtn} onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className={styles.navMenu}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navActive : ''}`
                }
              >
                <Icon size={20} className={styles.navIcon} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => {
                logout();
                setSidebarOpen(false);
              }}
              className={styles.logoutBtn}
            >
              <LogOut size={20} className={styles.navIcon} />
              <span>Keluar (Admin)</span>
            </button>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <p className={styles.footerVersion}>v1.0.0 (BPS IPDS)</p>
          <p className={styles.footerDesc}>Sistem Monitoring Inventaris Kantor</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        <header className={`glass ${styles.desktopHeader}`}>
          <div className={styles.headerTitle}>
            {isAdmin ? (
              <>
                <h3>Halo, Admin</h3>
                <p>Kelola database barang dan user kantor</p>
              </>
            ) : (
              <>
                <h3>Halo, Pengguna BPS</h3>
                <p>Pantau barang kantor secara real-time</p>
              </>
            )}
          </div>
          <div className={styles.headerActions}>
            <ThemeToggle />
          </div>
        </header>

        {/* Overlay backdrop on mobile */}
        {sidebarOpen && <div className={styles.backdrop} onClick={toggleSidebar} />}

        <main className={styles.content}>
          <div className="fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
