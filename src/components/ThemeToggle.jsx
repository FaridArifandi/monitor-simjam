import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={styles.toggleBtn}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      <div className={`${styles.iconContainer} ${theme === 'dark' ? styles.dark : styles.light}`}>
        {theme === 'dark' ? (
          <Moon size={18} className={styles.moon} />
        ) : (
          <Sun size={18} className={styles.sun} />
        )}
      </div>
    </button>
  );
}
