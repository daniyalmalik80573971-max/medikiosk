require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Case = require('./models/Case');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medikiosk');
  console.log('Connected to MongoDB');
  
  // Create admin
  const adminExists = await User.findOne({ email: 'admin@medikiosk.com' });
  if (!adminExists) {
    await User.create({ name: 'Admin User', email: 'admin@medikiosk.com', password: 'Admin@123', role: 'admin' });
    console.log('Admin created: admin@medikiosk.com / Admin@123');
  }
  
  // Create doctor
  const doctorExists = await User.findOne({ email: 'doctor@medikiosk.com' });
  if (!doctorExists) {
    await User.create({
      name: 'Dr. Priya Sharma', email: 'doctor@medikiosk.com', password: 'Doctor@123',
      role: 'doctor', specialization: 'Ayurveda & Internal Medicine',
      licenseNumber: 'AIIA/2020/001', department: 'OPD', phone: '9876543210'
    });
    console.log('Doctor created: doctor@medikiosk.com / Doctor@123');
  }
  
  // Create patient
  const patientExists = await User.findOne({ email: 'patient@medikiosk.com' });
  let patient;
  if (!patientExists) {
    patient = await User.create({
      name: 'Rahul Verma', email: 'patient@medikiosk.com', password: 'Patient@123',
      role: 'patient', phone: '9988776655', gender: 'male',
      dateOfBirth: new Date('1990-05-15')
    });
    console.log('Patient created: patient@medikiosk.com / Patient@123');
  } else {
    patient = patientExists;
  }
  
  // Create sample case
  const caseExists = await Case.findOne({ patient: patient._id });
  if (!caseExists) {
    await Case.create({
      patient: patient._id,
      status: 'reviewed',
      priority: 'routine',
      basicInfo: {
        fullName: 'Rahul Verma', age: 34, gender: 'male',
        phone: '9988776655', address: 'New Delhi, India'
      },
      chiefComplaint: 'Headache and fever for 3 days',
      symptoms: [{ name: 'Headache', severity: 6, duration: '3 days' }, { name: 'Fever', severity: 5, duration: '3 days' }],
      pastMedicalHistory: { hypertension: true },
      currentMedications: [{ name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' }],
      allergies: { drugAllergies: ['Penicillin'] },
      aiSummary: { text: 'Patient presents with 3-day history of headache and fever. Known hypertensive on Amlodipine. Penicillin allergy noted.', generatedAt: new Date() },
      doctorNotes: 'Viral fever likely. Advised rest and paracetamol. Follow up in 3 days.',
      consentGiven: true,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    console.log('Sample case created');
  }
  
  console.log('\n✅ Seed complete!');
  console.log('Login credentials:');
  console.log('Admin:   admin@medikiosk.com / Admin@123');
  console.log('Doctor:  doctor@medikiosk.com / Doctor@123');
  console.log('Patient: patient@medikiosk.com / Patient@123');
  
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(console.error);
