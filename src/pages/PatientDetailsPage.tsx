import { Navigate, useParams } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { usePatients } from '../hooks/usePatients';
import { useAuth } from '../hooks/useAuth';

export default function PatientDetailsPage() {
  const { id } = useParams();
  const { patients } = usePatients();
  const { isDoctor, doctorName } = useAuth();

  const patient = patients.find((entry) => entry.id === id);

  if (!patient) {
    return <Navigate to="/patients" replace />;
  }

  if (isDoctor && doctorName && patient.consultingDoctor !== doctorName) {
    return <Navigate to="/patients" replace />;
  }

  if (isDoctor && !doctorName) {
    return <Navigate to="/patients" replace />;
  }

  return (
    <Card>
      <p>Patient ID: {patient.id}</p>
      <h2>{patient.patientName}</h2>
      <p>Contact Number: {patient.contactNumber}</p>
      <p>Gender: {patient.gender}</p>
      <p>Age: {patient.age}</p>
      <p>Reason For Visit: {patient.reasonForVisit}</p>
      <p>Consulting Doctor: {patient.consultingDoctor}</p>
      <p>Specialization: {patient.specialization}</p>
      <p>Appointment Date: {patient.appointmentDate}</p>
      <p>Appointment Time: {patient.appointmentTime}</p>
      <p>Queue No: {patient.queueNo}</p>
      <p>Priority: {patient.priority}</p>
      <p>Follow-up Appointment: {patient.followUpAppointment}</p>
      <p>Visit Notes: {patient.visitNotes}</p>
      <p>Status: {patient.status}</p>
      <p>Progress: {patient.completed ? 'Done' : 'Pending'}</p>
    </Card>
  );
}
