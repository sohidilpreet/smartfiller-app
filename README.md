# 🚀 SmartFiller+  
**A cross-platform SaaS app for machine monitoring and user access control.**

![React](https://img.shields.io/badge/Frontend-React.js-blue?logo=react)
![React Native](https://img.shields.io/badge/Mobile-React%20Native-green?logo=react)
![Node](https://img.shields.io/badge/Backend-Node.js-brightgreen?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![Fullstack](https://img.shields.io/badge/Stack-Full--Stack-purple)

---

## 🧠 What is SmartFiller+?

**SmartFiller+** is a production-grade, full-stack platform that allows:
- 🏭 Companies to manage smart machines
- 👨‍💼 Admins to create and manage users
- 🔐 Secure company-scoped access control
- 📁 File uploads (images, PDFs) to machine logs
- 📊 Real-time data logs per machine
- 📱 Web and mobile access using a shared backend

Built from scratch using modern tools and best practices, inspired by Unifiller’s machine management needs.

---

## ⚙️ Tech Stack

| Layer          | Technology                              |
|----------------|------------------------------------------|
| Frontend (Web) | React.js, Axios, Context API             |
| Frontend (Mobile) | React Native (Expo), AsyncStorage     |
| Backend        | Node.js, Express.js                      |
| Database       | PostgreSQL with pg / knex                |
| Auth           | JWT-based login with company scoping     |
| Deployment     | Local & cloud-ready APIs                 |

---

## 🔐 Key Features

### ✅ Authentication & Authorization
- JWT login
- Company-scoped user accounts
- Roles: Admin / Controller / Viewer

### 🏭 Machine Management
- Admins create machines
- Controllers run and log operations
- Viewers can view and download files

### 🗃️ File Management
- Upload images / PDFs to each machine
- See uploaded files with metadata
- Download/view options included

### 📱 Cross-Platform UI
- Full React.js dashboard (web)
- Fully functional React Native version (mobile)
- Shared API backend

---

## 📸 Screenshots

<details>
  <summary>🔓 Login</summary>
  <img src="https://github.com/sohidilpreet/smartfiller-app/blob/main/main/assets/screens/login.png" width="300" />

</details>

<details>
  <summary>📋 Dashboard</summary>
  <img src="https://github.com/sohidilpreet/smartfiller-app/blob/main/main/assets/screens/dashboard.png" width="300" />
</details>

<details>
  <summary>🧾 Machine Detail + File Viewer</summary>
  <img src="https://github.com/sohidilpreet/smartfiller-app/blob/main/main/assets/screens/machine-detail.png" width="300" />
</details>

---

## 🛠️ How to Run Locally

```### 🌐 Frontend (React Web)
bash
cd web
npm install
npm start

### 📱 Mobile (React Native)
bash
cd mobile
npx expo start

### 🖥️ Backend (Express + PostgreSQL)
bash
cd server
npm install
# create .env with DB creds
npm run dev


