# 🎓 CampusConnect

CampusConnect is a modern campus collaboration platform designed to help students connect, share information, and interact within their academic community.
The application integrates AI-powered features, real-time data management, and a smooth user interface to create a smart campus environment.

---

# 🚀 Project Overview

CampusConnect provides a digital hub for students where they can:

* Connect with other students on campus
* Share updates, announcements, and discussions
* Access intelligent AI-powered assistance
* Manage user profiles and campus interactions
* Experience a fast and modern web interface

The platform is designed with scalability in mind and leverages modern full-stack technologies to deliver a responsive and secure user experience.

---

# ✨ Features

* 👤 Student profile system
* 🤖 AI-powered campus assistance using Gemini AI
* 🔥 Firebase-powered backend services
* ⚡ Real-time data handling
* 📱 Responsive modern UI
* 🔐 Secure backend access using Firebase Admin SDK

---

# 🛠️ Technologies Used

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend & Services

* Firebase
* Firebase Admin SDK
* Genkit AI Framework
* Google Gemini AI

### Development Tools

* Node.js
* Git
* npm

---

# 📋 Prerequisites

Before running the project locally, make sure you have:

* **Node.js (v18 or later)**
* **npm**
* **Git**
* **Firebase project access**
* **Google AI Studio API Key**

---

# 📦 Installation

Clone the repository to your local machine.

```bash
git clone <your-repository-url>
cd <your-project-directory>
```

Install all required dependencies.

```bash
npm install
```

---

# ⚙️ Environment Setup

Create a file called:

```
.env.local
```

in the root directory.

### 1️⃣ Add Gemini API Key

Get your API key from:

https://aistudio.google.com/app/apikey

Then add:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

---

### 2️⃣ Add Firebase Service Account

Download the service account key from:

https://console.firebase.google.com

Steps:

1. Go to **Project Settings**
2. Select **Service Accounts**
3. Click **Generate New Private Key**
4. Download the JSON file

Move the downloaded file to the project root and rename it:

```
firebase-service-account.json
```

Add this to `.env.local`:

```
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

---

# ▶️ Running the Project Locally

This project requires **two development servers**.

Open **two terminal windows**.

---

### Terminal 1 — Start the AI Server

```bash
npm run genkit:watch
```

This runs the **Genkit AI server** and automatically reloads when AI flows change.

---

### Terminal 2 — Start the Web Application

```bash
npm run dev
```

This starts the **Next.js development server**.

---

# 🌐 Access the Application

Once both servers are running, open your browser and visit:

```
http://localhost:9003
```

You should now see the **CampusConnect application running locally**.

---

# 🔒 Security Note

Never commit sensitive files such as:

```
.env.local
firebase-service-account.json
```

Make sure they are included in your `.gitignore`.

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

---

# 📄 License

This project is open-source and available under the MIT License.

---

# ⭐ Support

If you like this project, consider giving it a **star on GitHub** to support the development.
