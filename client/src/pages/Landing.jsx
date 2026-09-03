import { Link } from 'react-router-dom';
import { Brain, Mic, FileText, AlertTriangle, Users, Shield, CheckCircle, ArrowRight, Heart, Activity, Stethoscope } from 'lucide-react';

export default function Landing() {
  const features = [
    { icon: Brain, title: 'AI-Guided History Taking', desc: 'Intelligent adaptive questioning system that collects complete medical history before consultation.' },
    { icon: Mic, title: 'Voice Input Support', desc: 'Patients can speak their answers using natural voice input. Fully hands-free operation.' },
    { icon: FileText, title: 'Document OCR', desc: 'Upload prescriptions and lab reports. AI extracts and organizes text automatically.' },
    { icon: AlertTriangle, title: 'Red Flag Detection', desc: 'Automatically detects emergency symptoms and alerts doctors for priority attention.' },
    { icon: Users, title: 'Multi-Role System', desc: 'Separate dashboards for patients, doctors, and administrators.' },
    { icon: Shield, title: 'Safe & Compliant', desc: 'AI never diagnoses or prescribes. All data secure with JWT authentication.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-blue-700">MediKiosk</span>
              <span className="text-xs text-gray-500 ml-1">AI Powered</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Login</Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Stethoscope className="w-4 h-4" />
            Smart India Hackathon 2024 | Ministry of Ayush
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            AI-Powered Patient
            <span className="text-blue-600 block">Case-Taking Software</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Revolutionizing OPD consultations at AIIA and Ayush hospitals. 
            Patients complete their medical history before meeting the doctor — 
            saving consultation time and improving care quality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg">
              Start as Patient <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors font-semibold text-lg">
              Doctor / Admin Login
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">Demo: patient@medikiosk.com / Patient@123</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {[
            { value: '60%', label: 'Reduced Consultation Time' },
            { value: '100%', label: 'AI Safety Compliant' },
            { value: '3 Roles', label: 'Patient · Doctor · Admin' },
            { value: 'AYUSH', label: 'Ministry Aligned' }
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Complete Feature Set</h2>
          <p className="text-center text-gray-600 mb-12">Everything needed for a modern digital OPD workflow</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Patient Flow */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Register & Login', desc: 'Create your patient account in seconds' },
            { step: '02', title: 'AI Conversation', desc: 'Answer AI questions about your symptoms and history' },
            { step: '03', title: 'Upload Documents', desc: 'Add prescriptions and reports for OCR extraction' },
            { step: '04', title: 'Doctor Reviews', desc: 'Doctor gets complete summary before your consultation' }
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">{item.step}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Safety Notice */}
      <section className="bg-amber-50 border-y border-amber-200 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-800">Important Safety Information</span>
          </div>
          <p className="text-amber-700 text-sm">MediKiosk AI does NOT diagnose diseases, prescribe medicines, or replace a doctor. The AI only collects, organizes, and summarizes patient information to assist healthcare professionals.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-lg">MediKiosk</span>
          </div>
          <p className="text-gray-400 text-sm">Smart India Hackathon | Problem Statement SIH26047 | Ministry of Ayush / AIIA</p>
          <p className="text-gray-500 text-xs mt-2">© 2024 MediKiosk. Built for better healthcare.</p>
        </div>
      </footer>
    </div>
  );
}
