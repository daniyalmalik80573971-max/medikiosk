# MediKiosk - AI Powered Patient Case-Taking Software
## Smart India Hackathon 2024 | Problem Statement SIH26047
### Ministry of Ayush / All India Institute of Ayurveda

---

## Demo Credentials

| Role    | Email                      | Password    |
|---------|----------------------------|-------------|
| Patient | patient@medikiosk.com      | Patient@123 |
| Doctor  | doctor@medikiosk.com       | Doctor@123  |
| Admin   | admin@medikiosk.com        | Admin@123   |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

### Setup

1. **Clone / Navigate to project:**
`
cd medikiosk
`

2. **Install server dependencies:**
`
cd server
npm install
`

3. **Install client dependencies:**
`
cd ../client
npm install
`

4. **Configure environment (server/.env):**
`
MONGODB_URI=mongodb://localhost:27017/medikiosk
JWT_SECRET=medikiosk_super_secret_jwt_key_2024
OPENAI_API_KEY=   (optional - leave blank for demo mode)
`

5. **Seed demo data:**
`
cd server
node seedData.js
`

6. **Start server (Terminal 1):**
`
cd server
node index.js
`

7. **Start client (Terminal 2):**
`
cd client
npm run dev
`

8. **Open browser:** http://localhost:5173

---

## Features

- AI-Guided Medical History Collection
- Voice Input (Web Speech API)
- Document Upload + OCR (Tesseract.js)
- Red Flag Detection
- Case Summary Generation
- PDF Report Download
- Multi-Role Dashboards (Patient / Doctor / Admin)
- AYUSH/Ayurveda History Collection
- JWT Authentication + Role-Based Access

## AI Mode

- With OPENAI_API_KEY: Uses GPT-3.5-turbo for dynamic conversations
- Without API Key: Uses built-in rule-based demo mode (fully functional)

## Safety Disclaimer

MediKiosk AI does NOT diagnose diseases, prescribe medicines, or replace doctors.
The AI only collects, organizes, and summarizes patient information.
