import { Button } from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useUI } from '../../hooks/useUI';
import { FaBell, FaUserShield, FaUserDoctor } from 'react-icons/fa6';

export function Topbar() {
  const { logout, role, user } = useAuth();
  const { notifications, clearNotifications } = useUI();

  return (
    <header className="topbar">
      <div>
        <h1 className="topbar-title">Welcome to MedVisit</h1>
        <p className="topbar-subtitle">
          <FaBell style={{ marginRight: 6 }} />
          Notifications: {notifications.length} | Role:{' '}
          {role === 'admin' ? <FaUserShield style={{ marginBottom: -2 }} /> : <FaUserDoctor style={{ marginBottom: -2 }} />}{' '}
          {role} | User: {user?.email ?? 'N/A'}
        </p>
      </div>
      <div className="topbar-actions">
        <Button variant="secondary" onClick={clearNotifications}>
          Clear Alerts
        </Button>
        <Button onClick={() => void logout()}>Logout</Button>
      </div>
    </header>
  );
}
