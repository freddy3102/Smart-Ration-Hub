# Smart Ration Hub

Smart Ration Hub is a web-based ration management system developed to
simplify and organize the management of beneficiaries, ration inventory,
distribution activities, and administrative information.

The system provides a centralized platform for managing ration shop
operations through a React frontend, Flask backend, and MySQL database.

---

## Features

### Administrator Authentication
- Administrator login
- Controlled access to the system
- Validation of login credentials

### Dashboard
- Total beneficiary count
- Inventory overview
- Distribution information
- Low-stock information
- Centralized administrative monitoring

### Beneficiary Management
- Add new beneficiaries
- View beneficiary records
- Edit beneficiary information
- Delete beneficiary records
- Manage beneficiary details
- Ration card category selection
- Beneficiary status management

### Beneficiary Validation
The system validates important beneficiary information such as:
- Ration card number
- Aadhaar number
- Username

Duplicate records are prevented during beneficiary registration.

### Ration Card Categories
The system supports ration card category management and associates
beneficiaries with their respective categories.

Current categories include:
- PHH
- AAY
- NPS

### Inventory Management
- Manage ration stock information
- View available inventory
- Monitor stock status
- Identify low-stock items

### Distribution Management
- Record ration distribution activities
- Maintain distribution records
- Manage distribution-related information

### Reports
- Access organized beneficiary information
- View inventory-related information
- View distribution-related information
- Support administrative analysis

---

## Technology Stack

### Frontend
- React.js
- JavaScript
- HTML
- CSS
- Axios

### Backend
- Python
- Flask
- Flask-CORS
- REST APIs

### Database
- MySQL

### Development Tools
- Visual Studio Code
- Git
- GitHub

---

## System Architecture

The application follows a three-layer architecture:

```text
+----------------------+
|     React Frontend   |
|                      |
|  User Interface      |
|  Forms & Dashboard   |
+----------+-----------+
           |
           | REST API
           | Axios
           |
+----------v-----------+
|     Flask Backend    |
|                      |
| Authentication       |
| Beneficiaries        |
| Inventory            |
| Distribution         |
| Reports              |
+----------+-----------+
           |
           | MySQL Connector
           |
+----------v-----------+
|     MySQL Database   |
|                      |
| Beneficiary Data     |
| Category Data        |
| Inventory Data       |
| Distribution Data    |
+----------------------+
