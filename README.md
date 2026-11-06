# MediShare 💊
### Smart Medicine Inventory & Expiry Management System

MediShare is a web-based medicine management application that helps individuals and families organize their medicine inventory, monitor expiry dates, track stock levels and reduce medicine wastage.

## ✨ Features

- **Medicine Management:** Add, view, edit, search and delete medicines.
- **Expiry Tracking:** Monitor expired, expiring-soon and safe medicines.
- **Expiry Rescue:** Identify medicines that need attention before expiry.
- **Stock & Usage Tracking:** Record medicine usage, monitor low stock and manage refills.
- **Family Management:** Assign medicines to family members.
- **Calendar:** Track important medicine expiry dates.
- **Analytics:** Monitor medicine wastage, inventory and expenses.
- **Medicine Passport:** Access medicine-related information.
- **Prescription Scanner:** Support prescription-related medicine management.
- **Smart Storage:** Get medicine storage guidance.
- **AI Medicine Scanner:** Use Gemini Vision API to extract medicine details from package images.

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| AI Integration | Google Gemini API |
| Development Tools | VS Code, Git, GitHub, Postman |
| Deployment | Render |

## 🔗 Project Links

- **Live Website:** https://medishare-1-dpyb.onrender.com
- **Backend API:** https://medishare-zp75.onrender.com
- **GitHub Repository:** https://github.com/advitiandanur10-byte/MediShare-

## 📁 Project Structure

```text
MediShare/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── App.css
│
├── server/
│   ├── models/
│   ├── routes/
│   ├── .env
│   └── server.js
│
├── .gitignore
├── package.json
└── README.md
```

## ⚙️ Installation and Setup

**1. Clone the repository**

```bash
git clone https://github.com/advitiandanur10-byte/MediShare-.git
cd MediShare-
```

**2. Install dependencies**

Frontend:
```bash
cd client
npm install
```

Backend (in a separate terminal):
```bash
cd server
npm install
```

**3. Configure environment variables**

Create a `.env` file inside the `server` folder:

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

**4. Start the application**

Backend:
```bash
cd server
node server.js
```

Frontend (in another terminal):
```bash
cd client
npm run dev
```

Open the local URL provided by Vite, usually `http://localhost:5173`.

**Note:** Never upload your `.env` file or expose your API keys publicly.

## 🚀 Future Enhancements

- Improve AI-based medicine recognition.
- Enhance prescription-to-inventory reconciliation.
- Expand QR-based medicine identification.
- Add more intelligent medicine insights.

## 👩‍💻 MediShare

**Care • Share • Save**

A project focused on smarter medicine management, responsible medicine usage and reducing household medicine wastage.