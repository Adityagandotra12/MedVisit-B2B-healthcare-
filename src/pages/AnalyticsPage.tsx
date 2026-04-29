import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMemo, useState } from 'react';
import { Card } from '../components/common/Card';
import { usePatients } from '../hooks/usePatients';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';

export default function AnalyticsPage() {
  const { patients } = usePatients();
  const { isDoctor, doctorName } = useAuth();
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');

  const filteredPatients = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (period === 'all') {
      start.setTime(0);
    } else if (period === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      start.setDate(now.getDate() - 7);
    } else {
      start.setDate(now.getDate() - 30);
    }

    return patients.filter((patient) => {
      const visit = new Date(patient.appointmentDate);
      const periodMatch = period === 'all' ? true : visit >= start && visit <= now;
      const doctorMatch = isDoctor
        ? Boolean(doctorName) && patient.consultingDoctor === doctorName
        : doctorFilter === 'all' || patient.consultingDoctor === doctorFilter;
      return periodMatch && doctorMatch;
    });
  }, [doctorFilter, doctorName, isDoctor, patients, period]);

  const doctors = useMemo(() => {
    const unique = Array.from(new Set(patients.map((patient) => patient.consultingDoctor)));
    if (isDoctor && doctorName && !unique.includes(doctorName)) {
      unique.push(doctorName);
    }
    return unique;
  }, [doctorName, isDoctor, patients]);

  const appointmentsByDoctor = useMemo(() => {
    const doctorMap = new Map<string, { doctor: string; appointments: number; completed: number }>();

    for (const patient of filteredPatients) {
      const current = doctorMap.get(patient.consultingDoctor) ?? {
        doctor: patient.consultingDoctor,
        appointments: 0,
        completed: 0,
      };
      current.appointments += 1;
      if (patient.completed) {
        current.completed += 1;
      }
      doctorMap.set(patient.consultingDoctor, current);
    }

    return Array.from(doctorMap.values());
  }, [filteredPatients]);

  const statusDistribution = useMemo(() => {
    const statusMap = new Map<string, number>();

    for (const patient of filteredPatients) {
      statusMap.set(patient.status, (statusMap.get(patient.status) ?? 0) + 1);
    }

    return Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));
  }, [filteredPatients]);

  const lastUpdated = new Date().toLocaleTimeString();
  const followUpCount = filteredPatients.filter((patient) => !patient.completed).length;
  const queueCount = filteredPatients.filter((patient) => patient.status === 'Needs Attention').length;

  const handleExportReport = () => {
    if (filteredPatients.length === 0) {
      return;
    }

    const escapeCsv = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;

    const header = [
      'Patient ID',
      'Patient Name',
      'Contact Number',
      'Gender',
      'Age',
      'Consulting Doctor',
      'Specialization',
      'Appointment Date',
      'Appointment Time',
      'Queue No',
      'Status',
      'Priority',
      'Follow-up Appointment',
      'Visit Notes',
    ];

    const rows = filteredPatients.map((patient) => [
      patient.id,
      patient.patientName,
      patient.contactNumber,
      patient.gender,
      patient.age,
      patient.consultingDoctor,
      patient.specialization,
      patient.appointmentDate,
      patient.appointmentTime,
      patient.queueNo,
      patient.status,
      patient.priority,
      patient.followUpAppointment,
      patient.visitNotes,
    ]);

    const summaryRows = [
      ['Report Period', period],
      ['Doctor Filter', isDoctor ? doctorName ?? 'Restricted' : doctorFilter],
      ['Total Patients', filteredPatients.length],
      ['Follow-up Count', followUpCount],
      ['Queue Status Count', queueCount],
      ['Generated At', new Date().toISOString()],
      [],
    ];

    const csvContent = [
      ...summaryRows.map((row) => row.map((value) => escapeCsv(value)).join(',')),
      header.map((value) => escapeCsv(value)).join(','),
      ...rows.map((row) => row.map((value) => escapeCsv(value)).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medvisit-analytics-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="page-grid">
      <Card>
        <div className="patients-toolbar">
          <h2 style={{ margin: 0 }}>Analytics</h2>
          <div className="patients-actions">
            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as 'all' | 'today' | 'week' | 'month')
              }
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
            <select
              value={isDoctor ? doctorName ?? '' : doctorFilter}
              onChange={(event) => setDoctorFilter(event.target.value)}
              disabled={isDoctor}
            >
              {isDoctor ? (
                <option value={doctorName ?? ''}>{doctorName ?? 'Unknown'}</option>
              ) : (
                <>
                  <option value="all">All Doctors</option>
                  {doctors.map((doctor) => (
                    <option key={doctor} value={doctor}>
                      {doctor}
                    </option>
                  ))}
                </>
              )}
            </select>
            <Button
              variant="secondary"
              onClick={handleExportReport}
              disabled={filteredPatients.length === 0}
            >
              Export Report
            </Button>
          </div>
        </div>
      </Card>
      {filteredPatients.length === 0 ? (
        <Card>
          <EmptyState
            title="No analytics data"
            description="No patient visits match the selected filters."
          />
        </Card>
      ) : null}
      <Card>
        <h3 className="chart-title">Appointments vs Completed (Live)</h3>
        <p className="summary-label" style={{ marginBottom: '0.5rem' }}>
          Updates instantly from patient records. Last refresh: {lastUpdated}
        </p>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={appointmentsByDoctor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="doctor" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="appointments" stroke="#2563eb" />
              <Line type="monotone" dataKey="completed" stroke="#16a34a" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="chart-title">Patient Status Distribution (Live)</h3>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#7c3aed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="summary-grid">
        <Card>
          <p className="summary-label">Daily patient visits</p>
          <p className="summary-value">{filteredPatients.length}</p>
        </Card>
        <Card>
          <p className="summary-label">Doctor-wise consultations</p>
          <p className="summary-value">{appointmentsByDoctor.length}</p>
        </Card>
        <Card>
          <p className="summary-label">Follow-up count</p>
          <p className="summary-value">{followUpCount}</p>
        </Card>
        <Card>
          <p className="summary-label">Queue status</p>
          <p className="summary-value">{queueCount}</p>
        </Card>
      </div>
    </section>
  );
}
