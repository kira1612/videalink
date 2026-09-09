# IoT Platform: Full-Stack Integration with Laravel Backend

## Overview
We have successfully integrated a fully functional **Laravel API Backend** with our modern **React / Tailwind CSS** frontend. The platform now utilizes a real MySQL database with token-based authentication via Laravel Sanctum.

## Accomplishments

### Backend (Laravel 11)
- **Environment & Database**: Connected to Laragon's MySQL database (`iot_platform`).
- **Authentication**: Installed and configured **Laravel Sanctum** for SPA token-based authentication.
- **Database Schema**: 
  - `users` (Admin access)
  - `devices` (IoT Devices registry)
  - `data_buckets` (Data stream configuration)
  - `bucket_records` (Time-series payload)
  - `endpoints` (External webhooks/actions)
  - `activity_logs` (System events)
- **API Controllers**: Developed controllers mapping perfectly to the frontend's requirements.
- **Seeding**: Populated the database with extensive, realistic mock data for 6 devices, multiple data buckets with records, and triggered endpoints.

### Frontend (React + Vite)
- **API Service Layer**: Created `src/services/api.js` using Axios to handle all requests to the backend (`http://localhost:8000/api/v1`), including automatic Bearer token injection and error handling.
- **Dynamic Pages Integration**: 
  - **Login**: Replaced static credentials with real authentication against `/api/v1/auth/login`.
  - **Dashboard**: Fetches live aggregate statistics, online devices, and recent activity logs.
  - **Devices**: Lists devices directly from the database and supports viewing details.
  - **Buckets**: Fetches configured data streams and their corresponding time-series records.
  - **Endpoints**: Lists dynamic webhook/alert triggers and their statuses.
  - **Sidebar**: Extracts real authenticated user details from local storage and handles secure logout.

## How to Test
Both the frontend and backend servers are currently running in the background.

1. **Open your local browser** and go to: `http://localhost:5173/`
2. **Login Credentials**:
   - **Email**: `admin@iot-platform.io`
   - **Password**: `password123`
3. Navigate around the dashboard, devices, buckets, and endpoints! All data displayed is fetched live from your Laravel MySQL database.
