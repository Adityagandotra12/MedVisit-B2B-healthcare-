export type PatientStatus = 'Stable' | 'Needs Attention' | 'Critical';

export interface Patient {
  id: string;
  patientName: string;
  contactNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  reasonForVisit: string;
  consultingDoctor: string;
  specialization: string;
  appointmentDate: string;
  appointmentTime: string;
  queueNo: string;
  followUpAppointment: string;
  visitNotes: string;
  status: PatientStatus;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
}
