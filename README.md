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
- [API Endpoints](#api-endpoints)
- [Logging](#logging)

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
- **Node.js** (v14 or later)
- **PostgreSQL**
- **Angular CLI** (for frontend development)

### Cloning the Repository

Clone this repository using the following command:

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### Backend (Node.js)

1. Navigate to the server directory:

    ```bash
    cd server
    ```

2. Install server dependencies:

    ```bash
    npm install
    ```

3. Start the backend server:

    ```bash
    npm run dev
    ```

   The backend server will run on `http://localhost:3000` by default.

### Frontend (Angular)

1. Navigate to the client directory:

    ```bash
    cd ../client
    ```

2. Install client dependencies:

    ```bash
    npm install
    ```

3. Start the Angular development server:

    ```bash
    npm start
    ```

   The Angular application will run on `http://localhost:4200` by default.

## Environment Variables

Create a `.env` file in the `server` directory with the following structure:

```plaintext
PORT=set_your_port
DATABASE_HOST=your_database_hostname
DATABASE_USERNAME=your_database_username
DATABASE_PASSWORD=your_database_password
DATABASE_NAME=your_database_name
ACCESS_SECRET_KEY=your_access_secret_key
ACCESS_EXPIRY=your_access_token_expiry_time
REFRESH_SECRET_KEY=your_refresh_secret_key
REFRESH_EXPIRY=your_refresh_token_expiry_time
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_MAIL=your_smtp_mail
```

Make sure to replace the placeholder values with your actual database credentials and secret keys.

## Deployment

To deploy this application on a server, follow these steps:

### Backend (Node.js)

1. Set up a PostgreSQL database on your server and update the `.env` file with the appropriate environment variables.
   
2. Install Node.js and ensure the required dependencies are installed:

    ```bash
    npm install
    ```

3. For production, build the backend:

    ```bash
    npm run build
    ```

4. Start the server:

    ```bash
    npm start
    ```

### Frontend (Angular)

Build the Angular application for production:

    ```bash
    ng build --prod
    ```
```

Ensure that the `api` routes are correctly proxied to your Node.js backend, and static files are served from the Angular `dist/` directory.
