import styles from './StatCard.module.css';

export default function StatCard({ title, value, icon: Icon, type = 'primary', description }) {
  const getTypeClass = () => {
    switch (type) {
      case 'success': return styles.success;
      case 'warning': return styles.warning;
      case 'danger': return styles.danger;
      default: return styles.primary;
    }
  };

  return (
    <div className={`glass ${styles.card} ${getTypeClass()}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={styles.iconWrapper}>
          <Icon size={20} />
        </div>
      </div>
      <div className={styles.body}>
        <h3 className={styles.value}>{value}</h3>
        {description && <p className={styles.desc}>{description}</p>}
      </div>
    </div>
  );
}
