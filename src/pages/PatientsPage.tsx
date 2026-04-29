import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { Table } from '../components/common/Table';
import { ToggleSwitch } from '../components/common/ToggleSwitch';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth';
import { usePatients } from '../hooks/usePatients';
import { useUI } from '../hooks/useUI';
import { pushBrowserNotification, requestNotificationPermission } from '../services/notification';
import type { Patient, PatientStatus } from '../features/patients/types';

export default function PatientsPage() {
  const { patients, addPatient, updatePatient, removePatient } = usePatients();
  const { viewMode, toggleViewMode, pushNotification } = useUI();
  const { isAdmin, isDoctor, doctorName } = useAuth();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [importError, setImportError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<
    | 'patientName'
    | 'appointmentDate'
    | 'queueNo'
    | 'status'
    | 'priority'
    | 'consultingDoctor'
  >('appointmentDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formValues, setFormValues] = useState({
    patientName: '',
    contactNumber: '',
    gender: 'Male',
    age: '',
    reasonForVisit: '',
    consultingDoctor: 'Dr. Aditya',
    specialization: '',
    appointmentDate: '',
    appointmentTime: '',
    queueNo: '',
    priority: 'Medium',
    followUpAppointment: '',
    visitNotes: '',
    status: 'Stable',
  });

  const addPatientFromForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) {
      setFormError('Only admin can add patients.');
      return;
    }
    if (
      !formValues.patientName.trim() ||
      !formValues.contactNumber.trim() ||
      !formValues.gender ||
      !formValues.age ||
      !formValues.reasonForVisit.trim() ||
      !formValues.consultingDoctor.trim() ||
      !formValues.specialization.trim() ||
      !formValues.appointmentDate ||
      !formValues.appointmentTime ||
      !formValues.queueNo.trim() ||
      !formValues.priority ||
      !formValues.status ||
      !formValues.followUpAppointment
    ) {
      setFormError('Please fill all patient fields.');
      return;
    }

    const created: Patient = {
      id: editingPatientId ?? `p-${Date.now()}`,
      patientName: formValues.patientName.trim(),
      contactNumber: formValues.contactNumber.trim(),
      gender: formValues.gender as 'Male' | 'Female' | 'Other',
      age: Number(formValues.age),
      reasonForVisit: formValues.reasonForVisit.trim(),
      consultingDoctor: formValues.consultingDoctor.trim(),
      specialization: formValues.specialization.trim(),
      appointmentDate: formValues.appointmentDate,
      appointmentTime: formValues.appointmentTime,
      queueNo: formValues.queueNo.trim(),
      priority: formValues.priority as 'Low' | 'Medium' | 'High',
      followUpAppointment: formValues.followUpAppointment,
      visitNotes: formValues.visitNotes.trim(),
      status: formValues.status as 'Stable' | 'Needs Attention' | 'Critical',
      completed: false,
    };
    if (editingPatientId) {
      updatePatient(created);
      pushNotification(`Patient updated: ${created.patientName}`);
    } else {
      addPatient(created);
      pushNotification(`New patient added: ${created.patientName}`);
      await requestNotificationPermission();
      pushBrowserNotification('MedVisit', `New patient added: ${created.patientName}`);
    }
    setFormValues({
      patientName: '',
      contactNumber: '',
      gender: 'Male',
      age: '',
      reasonForVisit: '',
      consultingDoctor: 'Dr. Aditya',
      specialization: '',
      appointmentDate: '',
      appointmentTime: '',
      queueNo: '',
      priority: 'Medium',
      followUpAppointment: '',
      visitNotes: '',
      status: 'Stable',
    });
    setFormError('');
    setIsAddPatientOpen(false);
    setEditingPatientId(null);
  };

  const normalizeStatus = (value: string): PatientStatus => {
    if (value === 'Critical' || value === 'Needs Attention' || value === 'Stable') {
      return value;
    }
    return 'Stable';
  };

  const normalizePriority = (value: string): 'Low' | 'Medium' | 'High' => {
    if (value === 'Low' || value === 'Medium' || value === 'High') {
      return value;
    }
    return 'Medium';
  };

  const normalizeGender = (value: string): 'Male' | 'Female' | 'Other' => {
    if (value === 'Male' || value === 'Female' || value === 'Other') {
      return value;
    }
    return 'Other';
  };

  const normalizeConsultingDoctor = (value: string): string => {
    const v = value.trim();
    const e = v.toLowerCase();
    if (e.includes('aditya')) return 'Dr. Aditya';
    if (e.includes('harini')) return 'Dr. Harini';
    if (e.includes('kapoor')) return 'Dr. Kapoor';
    if (e.includes('shah')) return 'Dr. Shah';
    return '';
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!isAdmin) {
      setImportError('Only admin can import patient data.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(firstSheet, {
        defval: '',
      });

      let importedCount = 0;
      for (const row of rows) {
        const patientName = String(row['Patient Name'] ?? '').trim();
        const contactNumber = String(row['Contact Number'] ?? '').trim();
        const reasonForVisit = String(row['Reason For Visit'] ?? '').trim();
        const consultingDoctor = normalizeConsultingDoctor(
          String(row['Consulting Doctor'] ?? ''),
        );
        const specialization = String(row['Specialization'] ?? '').trim();
        const appointmentDate = String(row['Appointment Date'] ?? '').trim();
        const appointmentTime = String(row['Appointment Time'] ?? '').trim();
        const queueNo = String(row['Queue No'] ?? '').trim();
        const followUpAppointment = String(row['Follow-up Appointment'] ?? '').trim();

        if (
          !patientName ||
          !contactNumber ||
          !reasonForVisit ||
          !consultingDoctor ||
          !specialization ||
          !appointmentDate ||
          !appointmentTime ||
          !queueNo ||
          !followUpAppointment
        ) {
          continue;
        }

        const importedPatient: Patient = {
          id: String(row['Patient ID'] ?? `p-${Date.now()}-${importedCount}`),
          patientName,
          contactNumber,
          gender: normalizeGender(String(row.Gender ?? 'Other')),
          age: Number(row.Age ?? 0),
          reasonForVisit,
          consultingDoctor,
          specialization,
          appointmentDate,
          appointmentTime,
          queueNo,
          status: normalizeStatus(String(row.Status ?? 'Stable')),
          priority: normalizePriority(String(row.Priority ?? 'Medium')),
          followUpAppointment,
          visitNotes: String(row['Visit Notes'] ?? ''),
          completed: false,
        };
        addPatient(importedPatient);
        importedCount += 1;
      }

      if (importedCount === 0) {
        setImportError('No valid records found in file.');
      } else {
        setImportError('');
        pushNotification(`${importedCount} patient record(s) imported.`);
        await requestNotificationPermission();
        pushBrowserNotification('MedVisit', `${importedCount} patient record(s) imported.`);
      }
    } catch {
      setImportError('Unable to import file. Please use a valid Excel/CSV format.');
    } finally {
      event.target.value = '';
    }
  };

  const handleStatusChange = useCallback((patientId: string, status: PatientStatus) => {
    if (!isDoctor) {
      return;
    }
    const patient = patients.find((entry) => entry.id === patientId);
    if (!patient) {
      return;
    }
    if (!doctorName || patient.consultingDoctor !== doctorName) {
      return;
    }
    updatePatient({ ...patient, status });
  }, [doctorName, isDoctor, patients, updatePatient]);

  const markPatientDone = useCallback((patientId: string) => {
    if (!isDoctor) {
      return;
    }
    const patient = patients.find((entry) => entry.id === patientId);
    if (!patient) {
      return;
    }
    if (!doctorName || patient.consultingDoctor !== doctorName) {
      return;
    }
    updatePatient({ ...patient, completed: true });
    pushNotification(`Doctor marked ${patient.patientName} as done.`);
  }, [doctorName, isDoctor, patients, pushNotification, updatePatient]);

  const openEditModal = useCallback((patient: Patient) => {
    if (!isAdmin) {
      return;
    }
    setEditingPatientId(patient.id);
    setFormValues({
      patientName: patient.patientName,
      contactNumber: patient.contactNumber,
      gender: patient.gender,
      age: String(patient.age),
      reasonForVisit: patient.reasonForVisit,
      consultingDoctor: patient.consultingDoctor,
      specialization: patient.specialization,
      appointmentDate: patient.appointmentDate,
      appointmentTime: patient.appointmentTime,
      queueNo: patient.queueNo,
      priority: patient.priority,
      followUpAppointment: patient.followUpAppointment,
      visitNotes: patient.visitNotes,
      status: patient.status,
    });
    setFormError('');
    setIsAddPatientOpen(true);
  }, [isAdmin]);

  const deletePatient = useCallback((patientId: string) => {
    if (!isAdmin) {
      return;
    }
    removePatient(patientId);
    pushNotification('Patient entry deleted.');
  }, [isAdmin, pushNotification, removePatient]);

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => {
        const matchesSearch =
          patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.contactNumber.includes(searchTerm);
        const matchesDoctor = isDoctor
          ? Boolean(doctorName) && patient.consultingDoctor === doctorName
          : doctorFilter === 'all' || patient.consultingDoctor === doctorFilter;
        const matchesStatus =
          statusFilter === 'all' || patient.status === statusFilter;
        const matchesDate = !dateFilter || patient.appointmentDate === dateFilter;
        return matchesSearch && matchesDoctor && matchesStatus && matchesDate;
      }),
    [
      dateFilter,
      doctorFilter,
      doctorName,
      isDoctor,
      patients,
      searchTerm,
      statusFilter,
    ],
  );

  const sortedPatients = useMemo(() => {
    const sorted = [...filteredPatients];
    sorted.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;

      if (sortBy === 'appointmentDate') {
        return (
          (new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()) *
          direction
        );
      }

      const left = String(a[sortBy]).toLowerCase();
      const right = String(b[sortBy]).toLowerCase();
      if (left < right) {
        return -1 * direction;
      }
      if (left > right) {
        return 1 * direction;
      }
      return 0;
    });
    return sorted;
  }, [filteredPatients, sortBy, sortDirection]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedPatients.length / pageSize)),
    [sortedPatients.length, pageSize],
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPatients = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedPatients.slice(start, start + pageSize);
  }, [pageSize, safeCurrentPage, sortedPatients]);

  const doctors = useMemo(
    () => Array.from(new Set(patients.map((patient) => patient.consultingDoctor))),
    [patients],
  );

  const tableRows = useMemo(
    () =>
      paginatedPatients.map((patient) => [
        patient.id,
        patient.patientName,
        patient.contactNumber,
        patient.gender,
        patient.age,
        patient.reasonForVisit,
        patient.consultingDoctor,
        patient.specialization,
        patient.appointmentDate,
        patient.appointmentTime,
        patient.queueNo,
        <Badge key={`${patient.id}-status`} tone={patient.status === 'Critical' ? 'danger' : patient.status === 'Needs Attention' ? 'warning' : 'success'}>
          {patient.status}
        </Badge>,
        <Badge key={`${patient.id}-priority`} tone={patient.priority === 'High' ? 'danger' : patient.priority === 'Medium' ? 'warning' : 'success'}>
          {patient.priority}
        </Badge>,
        patient.followUpAppointment,
        <Badge key={`${patient.id}-progress`} tone={patient.completed ? 'success' : 'warning'}>
          {patient.completed ? 'Done' : 'Pending'}
        </Badge>,
        patient.visitNotes,
        <div key={patient.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to={`/patients/${patient.id}`}>View</Link>
          {isAdmin ? (
            <>
              <button className="text-button" type="button" onClick={() => openEditModal(patient)}>
                Edit
              </button>
              <button className="text-button" type="button" onClick={() => deletePatient(patient.id)}>
                Delete
              </button>
            </>
          ) : null}
          {isDoctor && doctorName === patient.consultingDoctor ? (
            <>
              <select
                value={patient.status}
                onChange={(event) =>
                  handleStatusChange(
                    patient.id,
                    event.target.value as 'Stable' | 'Needs Attention' | 'Critical',
                  )
                }
              >
                <option value="Stable">Stable</option>
                <option value="Needs Attention">Needs Attention</option>
                <option value="Critical">Critical</option>
              </select>
              {!patient.completed ? (
                <Button
                  type="button"
                  onClick={() => markPatientDone(patient.id)}
                  style={{ padding: '0.4rem 0.55rem', fontSize: '0.8rem' }}
                >
                  Mark Done
                </Button>
              ) : (
                <span className="badge">Done</span>
              )}
            </>
          ) : null}
        </div>,
      ]),
    [
      deletePatient,
      doctorName,
      handleStatusChange,
      isAdmin,
      isDoctor,
      markPatientDone,
      openEditModal,
      paginatedPatients,
    ],
  );

  return (
    <section className="patients-page">
      <div className="patients-toolbar">
        <h2 style={{ margin: 0 }}>Patient Management</h2>
        <div className="patients-actions">
          <ToggleSwitch
            checked={viewMode === 'list'}
            onChange={toggleViewMode}
            leftLabel="Grid View"
            rightLabel="List View"
          />
          {isAdmin ? <Button onClick={() => setIsAddPatientOpen(true)}>Add Patient</Button> : null}
          {isAdmin ? (
            <label className="button secondary" style={{ margin: 0 }}>
              Import Data
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportData}
                style={{ display: 'none' }}
              />
            </label>
          ) : null}
          <Button variant="secondary" onClick={() => setIsHelpOpen(true)}>
            View Help
          </Button>
        </div>
      </div>
      {importError ? <p className="error">{importError}</p> : null}
      <Card>
        <div className="patients-actions">
          <input
            placeholder="Search by patient name or contact"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
          />
          <select
            value={isDoctor ? doctorName ?? '' : doctorFilter}
            onChange={(event) => {
              setDoctorFilter(event.target.value);
              setCurrentPage(1);
            }}
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
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="Stable">Stable</option>
            <option value="Needs Attention">Needs Attention</option>
            <option value="Critical">Critical</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => {
              setDateFilter(event.target.value);
              setCurrentPage(1);
            }}
          />
          <select
            value={String(pageSize)}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(
                event.target.value as
                  | 'patientName'
                  | 'appointmentDate'
                  | 'queueNo'
                  | 'status'
                  | 'priority'
                  | 'consultingDoctor',
              );
              setCurrentPage(1);
            }}
          >
            <option value="appointmentDate">Sort by Appointment Date</option>
            <option value="patientName">Sort by Patient Name</option>
            <option value="consultingDoctor">Sort by Doctor</option>
            <option value="queueNo">Sort by Queue No</option>
            <option value="status">Sort by Status</option>
            <option value="priority">Sort by Priority</option>
          </select>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
              setCurrentPage(1);
            }}
          >
            {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </div>
      </Card>

      <div className="patients-content-scroll">
        {filteredPatients.length === 0 ? (
          <Card>
            <EmptyState
              title="No patients found"
              description="No patient records match your current filters."
            />
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="patients-grid">
            {paginatedPatients.map((patient) => (
              <Card key={patient.id}>
                <h3 style={{ marginTop: 0 }}>{patient.patientName}</h3>
                <p>ID: {patient.id}</p>
                <p>Contact: {patient.contactNumber}</p>
                <p>Gender/Age: {patient.gender} / {patient.age}</p>
                <p>Reason: {patient.reasonForVisit}</p>
                <p>Doctor: {patient.consultingDoctor}</p>
                <p>Specialization: {patient.specialization}</p>
                <p>
                  <Badge tone={patient.status === 'Critical' ? 'danger' : patient.status === 'Needs Attention' ? 'warning' : 'success'}>
                    {patient.status}
                  </Badge>
                </p>
                <p>
                  <Badge tone={patient.completed ? 'success' : 'warning'}>
                    {patient.completed ? 'Done' : 'Pending'}
                  </Badge>
                </p>
                <p>Appointment: {patient.appointmentDate}</p>
                <p>Time: {patient.appointmentTime}</p>
                <p>Queue: {patient.queueNo}</p>
                <p>Priority: {patient.priority}</p>
                <p>Follow-up: {patient.followUpAppointment}</p>
                {isDoctor && doctorName === patient.consultingDoctor ? (
                  <div className="patients-actions" style={{ marginBottom: '0.5rem' }}>
                    <select
                      value={patient.status}
                      onChange={(event) =>
                        handleStatusChange(
                          patient.id,
                          event.target.value as 'Stable' | 'Needs Attention' | 'Critical',
                        )
                      }
                    >
                      <option value="Stable">Stable</option>
                      <option value="Needs Attention">Needs Attention</option>
                      <option value="Critical">Critical</option>
                    </select>
                    {!patient.completed ? (
                      <Button
                        type="button"
                        onClick={() => markPatientDone(patient.id)}
                        style={{ padding: '0.35rem 0.55rem', fontSize: '0.8rem' }}
                      >
                        Mark Done
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                <Link to={`/patients/${patient.id}`}>View details</Link>
                {isAdmin ? (
                  <div className="patients-actions" style={{ marginTop: '0.5rem' }}>
                    <button className="text-button" type="button" onClick={() => openEditModal(patient)}>
                      Edit
                    </button>
                    <button className="text-button" type="button" onClick={() => deletePatient(patient.id)}>
                      Delete
                    </button>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        ) : (
          <Table
            headers={[
              'Patient ID',
              'Patient Name',
              'Contact Number',
              'Gender',
              'Age',
              'Reason For Visit',
              'Consulting Doctor',
              'Specialization',
              'Appointment Date',
              'Appointment Time',
              'Queue No',
              'Status',
              'Priority',
              'Follow-up Appointment',
              'Progress',
              'Visit Notes',
              'Action',
            ]}
            rows={tableRows}
          />
        )}
        {sortedPatients.length > 0 ? (
          <Card>
            <div className="pagination">
              <p className="summary-label" style={{ margin: 0 }}>
                Showing {(safeCurrentPage - 1) * pageSize + 1}-
                {Math.min(safeCurrentPage * pageSize, sortedPatients.length)} of {sortedPatients.length}
              </p>
              <div className="patients-actions">
                <Button
                  variant="secondary"
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <span className="summary-label">Page {safeCurrentPage} / {totalPages}</span>
                <Button
                  variant="secondary"
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      <Modal
        isOpen={isAddPatientOpen}
        onClose={() => {
          setIsAddPatientOpen(false);
          setFormError('');
          setEditingPatientId(null);
        }}
        title={editingPatientId ? 'Edit Patient' : 'Add New Patient'}
      >
        <form onSubmit={addPatientFromForm}>
          <label className="field">
            <span>Name</span>
            <input
              value={formValues.patientName}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, patientName: event.target.value }))
              }
              placeholder="Enter patient name"
            />
          </label>
          <label className="field">
            <span>Contact Number</span>
            <input
              value={formValues.contactNumber}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, contactNumber: event.target.value }))
              }
              placeholder="e.g. +91 9876543210"
            />
          </label>
          <label className="field">
            <span>Gender</span>
            <select
              value={formValues.gender}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, gender: event.target.value }))
              }
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="field">
            <span>Age</span>
            <input
              type="number"
              min="0"
              value={formValues.age}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, age: event.target.value }))
              }
              placeholder="e.g. 35"
            />
          </label>
          <label className="field">
            <span>Reason For Visit</span>
            <input
              value={formValues.reasonForVisit}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, reasonForVisit: event.target.value }))
              }
              placeholder="e.g. Diabetes review"
            />
          </label>
          <label className="field">
            <span>Consulting Doctor</span>
            <select
              value={formValues.consultingDoctor}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, consultingDoctor: event.target.value }))
              }
            >
              <option value="Dr. Aditya">Dr. Aditya</option>
              <option value="Dr. Harini">Dr. Harini</option>
              <option value="Dr. Kapoor">Dr. Kapoor</option>
              <option value="Dr. Shah">Dr. Shah</option>
            </select>
          </label>
          <label className="field">
            <span>Specialization</span>
            <input
              value={formValues.specialization}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, specialization: event.target.value }))
              }
              placeholder="e.g. Cardiology"
            />
          </label>
          <label className="field">
            <span>Appointment Date</span>
            <input
              type="date"
              value={formValues.appointmentDate}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  appointmentDate: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Appointment Time</span>
            <input
              type="time"
              value={formValues.appointmentTime}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  appointmentTime: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Queue No</span>
            <input
              value={formValues.queueNo}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, queueNo: event.target.value }))
              }
              placeholder="e.g. Q-12"
            />
          </label>
          <label className="field">
            <span>Priority</span>
            <select
              value={formValues.priority}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, priority: event.target.value }))
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
          <label className="field">
            <span>Follow-up Appointment</span>
            <input
              type="date"
              value={formValues.followUpAppointment}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  followUpAppointment: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Visit Notes</span>
            <textarea
              value={formValues.visitNotes}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, visitNotes: event.target.value }))
              }
              rows={3}
              placeholder="Enter notes"
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={formValues.status}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, status: event.target.value }))
              }
            >
              <option value="Stable">Stable</option>
              <option value="Needs Attention">Needs Attention</option>
              <option value="Critical">Critical</option>
            </select>
          </label>
          {formError ? <p className="error">{formError}</p> : null}
          <Button type="submit">{editingPatientId ? 'Update Patient' : 'Save Patient'}</Button>
        </form>
      </Modal>

      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Patient Module Tips">
        <p>
          Admin can add patients. Doctors can view patients, update status, and mark them as done.
        </p>
      </Modal>
    </section>
  );
}
