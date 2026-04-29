import { NavLink } from 'react-router-dom';
import { FaChartLine, FaHospitalUser, FaStethoscope } from 'react-icons/fa6';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-emoji" aria-hidden="true">
          🩺
        </div>
        <div>
          <h2 className="sidebar-title">MedVisit</h2>
        </div>
      </div>
      <nav>
        <NavLink className="nav-link" to="/dashboard">
          <FaHospitalUser />
          Dashboard
        </NavLink>
        <NavLink className="nav-link" to="/analytics">
          <FaChartLine />
          Analytics
        </NavLink>
        <NavLink className="nav-link" to="/patients">
          <FaStethoscope />
          Patients
        </NavLink>
      </nav>
    </aside>
  );
}
