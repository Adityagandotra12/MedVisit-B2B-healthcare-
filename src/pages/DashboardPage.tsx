import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { usePatients } from '../hooks/usePatients';
import { useUI } from '../hooks/useUI';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { requestNotificationPermission, pushBrowserNotification } from '../services/notification';
import { FaBell, FaCalendarCheck, FaTriangleExclamation, FaUserInjured } from 'react-icons/fa6';

export default function DashboardPage() {
  const { patients } = usePatients();
  const { notifications, pushNotification } = useUI();
  const { user, isDoctor, doctorName } = useAuth();
  const today = new Date().toISOString().slice(0, 10);

  const scopedPatients = isDoctor && doctorName ? patients.filter((p) => p.consultingDoctor === doctorName) : isDoctor ? [] : patients;

  const todaysAppointments = scopedPatients.filter((patient) => patient.appointmentDate === today).length;
  const waitingQueue = scopedPatients.filter((patient) => !patient.completed).length;
  const followUpPending = scopedPatients.filter((patient) => !patient.completed && patient.followUpAppointment >= today).length;

  const recentRows = scopedPatients.slice(0, 5).map((patient) => [
    patient.patientName,
    patient.consultingDoctor,
    patient.appointmentDate,
    <Badge key={`${patient.id}-status`} tone={patient.status === 'Critical' ? 'danger' : patient.status === 'Needs Attention' ? 'warning' : 'success'}>
      {patient.status}
    </Badge>,
    <Link key={`${patient.id}-view`} to={`/patients/${patient.id}`}>
      Open
    </Link>,
  ]);

  const handleEnableNotifications = async () => {
    await requestNotificationPermission();
    pushBrowserNotification('MedVisit', 'Notifications enabled successfully.');
    pushNotification('Notifications enabled successfully.');
  };

  return (
    <section className="page-grid">
      <Card>
        <div className="patients-toolbar">
          <div>
            <h2 style={{ margin: 0 }}>Welcome to MedVisit</h2>
            <p className="summary-label">Signed in as {user?.email}</p>
          </div>
          <div className="patients-actions">
            <Link to="/patients">
              <Button>Add Patient Visit</Button>
            </Link>
            <Button variant="secondary" onClick={() => void handleEnableNotifications()}>
              Notification Button
            </Button>
          </div>
        </div>
      </Card>
      <div className="summary-grid">
        <Card>
          <p className="summary-label">
            <FaUserInjured style={{ marginRight: 6 }} />
            Total Patients
          </p>
          <p className="summary-value">{scopedPatients.length}</p>
        </Card>
        <Card>
          <p className="summary-label">
            <FaCalendarCheck style={{ marginRight: 6 }} />
            Today's Appointments
          </p>
          <p className="summary-value">{todaysAppointments}</p>
        </Card>
        <Card>
          <p className="summary-label">
            <FaTriangleExclamation style={{ marginRight: 6 }} />
            Waiting Queue
          </p>
          <p className="summary-value">{waitingQueue}</p>
        </Card>
        <Card>
          <p className="summary-label">
            <FaBell style={{ marginRight: 6 }} />
            Follow-up Pending
          </p>
          <p className="summary-value">{followUpPending}</p>
        </Card>
      </div>
      <Card>
        <h3 className="chart-title">Recent Patient Visits</h3>
        {recentRows.length === 0 ? (
          <p className="summary-label">No recent visits available.</p>
        ) : (
          <Table headers={['Patient', 'Doctor', 'Visit Date', 'Status', 'Action']} rows={recentRows} />
        )}
      </Card>
      <Card>
        <h3 className="chart-title">Recent Alerts</h3>
        {notifications.length === 0 ? (
          <p className="summary-label">No alerts yet.</p>
        ) : (
          notifications.slice(0, 5).map((note, idx) => (
            <p className="summary-label" key={`${note}-${idx}`} style={{ marginBottom: '0.35rem' }}>
              - {note}
            </p>
          ))
        )}
      </Card>
    </section>
  );
}
