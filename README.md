# MediShare 💊

### Smart Medicine Inventory & Expiry Management System

MediShare is a web-based medicine management application designed to help individuals and families organize their medicine inventory, monitor expiry dates, track stock levels, and reduce medicine wastage.

## ✨ Features

- **Medicine Inventory Management** – Add, view, edit, search and delete medicine records.
- **Expiry Tracking** – Monitor expired, expiring-soon and safe medicines.
- **Expiry Rescue System** – Identify medicines that need attention before expiry.
- **Low Stock Alerts** – Get notifications for medicines running low or out of stock.
- **Medicine Usage Tracking** – Record medicine consumption and update stock.
- **Refill Management** – Track replenishments and refill history.
- **Family Management** – Manage medicine assignments for family members.
- **Calendar View** – Monitor important medicine expiry dates.
- **Wastage Analytics** – View expiry trends, inventory breakdowns and potential wastage.
- **Expense Tracking** – Monitor initial purchase costs, refill expenditure and spending trends.
- **Medicine Passport** – Access medicine-related information through the passport feature.
- **Prescription Scanner** – Support prescription-related medicine management.
- **Smart Storage Guidance** – View storage-related guidance for medicines.
- **AI Medicine Scanner** – Gemini Vision API integration for extracting medicine details from package images (integration under development).

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB Atlas
- Mongoose

**AI Integration**
- Google Gemini API

**Development Tools**
- Visual Studio Code
- Git and GitHub
- Postman

## 📁 Project Structure

```text
medishare/
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

### 1. Clone the repository

```bash
git clone https://github.com/advitiandanur10-byte/MediShare-.git
cd MediShare-
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

Open another terminal:

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` folder:

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

Use your own credentials. Never upload your `.env` file or expose API keys publicly.

### 5. Start the backend

From the `server` directory:

```bash
node server.js
```

### 6. Start the frontend

From the `client` directory:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## 🔮 Future Enhancements

- Complete and improve AI-based medicine recognition.
- Improve prescription-to-inventory reconciliation.
- Enhance QR-based medicine identification.
- Add more intelligent medicine safety and inventory insights.

## 👩‍💻 Project

**MediShare – Care • Share • Save**

A project focused on smarter medicine management, responsible usage and reducing medicine wastage.