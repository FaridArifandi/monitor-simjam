import styles from './StatusBadge.module.css';

export default function StatusBadge({ status }) {
  const getLabelAndClass = () => {
    switch (status?.toLowerCase()) {
      case 'tersedia':
        return { label: 'Tersedia', className: styles.available };
      case 'dipinjam':
        return { label: 'Sedang Dipinjam', className: styles.borrowed };
      case 'maintenance':
        return { label: 'Maintenance', className: styles.maintenance };
      case 'dikembalikan':
        return { label: 'Dikembalikan', className: styles.returned };
      case 'terlambat':
        return { label: 'Terlambat', className: styles.overdue };
      default:
        return { label: status || 'Unknown', className: styles.unknown };
    }
  };

  const { label, className } = getLabelAndClass();

  return <span className={`${styles.badge} ${className}`}>{label}</span>;
}
