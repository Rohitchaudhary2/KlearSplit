# KlearSplit

**KlearSplit** is a web application that consists of a client built with Angular and a server built with Node.js, Express, and Sequelize (for database handling). The application uses JWT-based authentication and includes role-based access control, as well as cookie handling for refresh tokens.

## Table of Contents
- [Technologies Used](#technologies-used)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Cloning the Repository](#cloning-the-repository)
  - [Backend (Node.js)](#backend-nodejs)
  - [Frontend (Angular)](#frontend-angular)
- [Environment Variables](#environment-variables)

## Technologies Used

### Backend (Server):
- **Node.js** and **Express**
- **PostgreSQL** with **Sequelize ORM**
- **JWT** for authentication (access & refresh tokens)
- **Winston** for logging
- **Morgan** for request logging
- **Cookie-based authentication** (storing refresh tokens in cookies)
- **CORS** for managing cross-origin resource sharing between frontend and backend
- **bcrypt** for password hashing

### Frontend (Client):
- **Angular** (standalone approach)
- **Reactive Forms** and **HTTP Client**
- **LocalStorage** for access token management
- **Angular Interceptors** for attaching tokens to requests

## Installation

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v20)
- **PostgreSQL**
- **pgAdmin**
- **Angular CLI** (v18 for frontend development)

### Cloning the Repository

Clone this repository using the following command:

```bash
git clone https://github.com/Rohitchaudhary2/KlearSplit.git
cd KlearSplit
```

### Running the Application

1. Install dependencies:

    ```bash
    npm install
    ```

3. Start the application:

    ```bash
    npm run dev
    ```

   The backend server will run on `http://localhost:3000` by default.
   
   The Angular application will run on `http://localhost:4200` by default.

## Environment Variables

Create a `.env` file in the `server` directory and follow the structure in the sample.env file.

Firstly create a database in pgAdmin.
Make sure to replace the placeholder values with your actual database credentials and secret keys.
Create your app password from app passwords in Google account for SMTP_PASSWORD and use your email for both SMTP_USER as well as for SMTP_MAIL.
Create your google client credentials from google's developer console by creating new project.


Create a `config.ts` file in the `client/src/environments` directory with the following structure:

```plaintext
export const config = {
    encryptionSecretKey: 'your_secret_code'
};
```
