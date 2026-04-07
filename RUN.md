# How to Run the Nexus Platform

Follow these steps to get the platform up and running on your local machine.

## Prerequisites
- **Node.js**: Ensure you have Node.js installed.
- **MongoDB**: You need a running MongoDB instance. By default, the backend connects to `mongodb://localhost:27017/nexus`.

---

## 1. Backend Setup (`/server`)

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies (if not already done):
    ```bash
    npm install
    ```
3.  Configure environment variables:
    - Check `.env` file and ensure `MONGODB_URI` and `JWT_SECRET` are correct.
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The backend will run on [http://localhost:5000](http://localhost:5000).

---

## 2. Frontend Setup (Root)

1.  Navigate to the project root:
    ```bash
    cd ..
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    The application will be accessible at [http://localhost:5173](http://localhost:5173).

---

## 3. Demo Credentials

You can use the following accounts for testing:

### Entrepreneur
- **Email**: `mubasher12@gmail.com`
- **Password**: `mubasher12`
- **Role**: Entrepreneur

### Investor
- **Email**: `talha@gmail.com`
- **Password**: `mubasher12`
- **Role**: Investor

---

## Troubleshooting
- **Database Connection**: If the server hangs, check if your MongoDB service is running.
- **Port Conflicts**: Ensure ports 5000 and 5173 are free.
