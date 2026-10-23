# 🏙️ Chennai Civic Issues Reporting System

A citizen-focused web application designed to connect residents with local authorities by providing a centralized platform for reporting, tracking, and managing civic issues such as road damage, garbage accumulation, streetlight problems, drainage issues, and other public infrastructure concerns.

The system provides separate experiences for citizens, administrators, and field workers, enabling complaints to be reported, assigned, monitored, and resolved through a structured workflow.

---

## 📺 Project Walkthrough

### 🚀 Live Demo

> Add your deployed frontend URL here.

`https://your-live-project-url.com`

### 🎥 Demo Video

> Add your YouTube demonstration video here.

`https://www.youtube.com/watch?v=BieOYafL3q8&t=3s`

The demonstration showcases the complete workflow of the Chennai Civic Issues Reporting System, including complaint reporting, tracking, administration, and worker management.

---

# 🧩 The Problem

Civic issues in cities can remain unresolved because of several challenges:

- **Limited Transparency:** Citizens may not know the current status of their complaints.
- **Manual Reporting:** Describing locations manually can make it difficult for authorities to identify the exact issue location.
- **Duplicate Complaints:** Multiple citizens may report the same issue independently.
- **Delayed Assignment:** Complaints may not reach the appropriate worker or authority quickly.
- **Lack of Centralized Management:** Authorities require a unified system to monitor complaints and their progress.
- **Limited Analytics:** Without structured complaint data, identifying frequently affected areas can be difficult.
- **Communication Gap:** Citizens may not receive sufficient information about the progress of their reported issues.

---

# 💡 Our Solution

The **Chennai Civic Issues Reporting System** provides a centralized digital platform for managing civic complaints from reporting to resolution.

### 👤 Citizen Features

- User registration and login
- Report civic issues
- Select issue category
- Upload supporting images
- Provide issue location
- Track submitted complaints
- View complaint status
- View complaint history
- Monitor complaint progress

### 🛠️ Administrator Features

- Administrator dashboard
- View reported complaints
- Manage complaints
- Assign workers based on ward
- Monitor complaint status
- Manage users and workers
- View complaint statistics
- Analyze civic issues through dashboards
- Monitor repeated or high-priority issues

### 👷 Worker Features

- Worker dashboard
- View assigned complaints
- View complaint details
- Manage assigned tasks
- Update complaint status
- Track assigned civic issues

---

# ✨ Key Highlights

### 📍 Location-Based Reporting

Citizens can provide the location of a civic issue, helping authorities identify where the problem exists.

### 📷 Image-Based Evidence

Citizens can upload images to provide visual information about the reported issue.

### 🔄 Complaint Tracking

Complaints can move through different stages of the resolution process, allowing administrators and workers to monitor progress.

### 👥 Role-Based Access

The system separates functionality based on user roles:

```text
Citizen
   │
   ├── Report Issue
   ├── Track Complaint
   └── View History

Admin
   │
   ├── Manage Complaints
   ├── Assign Workers
   ├── Manage Users
   └── View Analytics

Worker
   │
   ├── View Assigned Issues
   ├── Manage Tasks
   └── Update Status

## How to run locally?
1. Clone the repo:
   
git clone https://github.com/omsalokhe/CivicConnect-Smart-Complaint-Reporting-System

2. Install dependencies
   
npm install

3. Start backend
   
node server.js

4. Open frontend
   
Open index.html using Live Server





