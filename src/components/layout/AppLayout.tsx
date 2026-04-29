import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NotificationToast } from '../common/NotificationToast';

export function AppLayout() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <Topbar />
        <Outlet />
        <NotificationToast />
      </main>
    </div>
  );
}
