# Frontend Features & Backend API Mapping

This document maps existing frontend features that require communication with the backend.

## Authentication & Authorization
- **Registration**: `POST /api/auth/register` (handles name, email, password, role).
- **Login**: `POST /api/auth/login` (handles email, password, role).
- **Logout**: `POST /api/auth/logout`.
- **Get Current User**: `GET /api/auth/me`.

## Dashboards
- **Entrepreneur Dashboard**: `GET /api/profiles/me` and potential data for stats.
- **Investor Dashboard**: `GET /api/profiles/me` and lists of entrepreneurs.

## Profiles
- **Fetch Profile**: `GET /api/profiles/:id`.
- **Update Profile**: `PUT /api/profiles/:id` (handles extended info like BIO, startup details, or investment history).
- **List Entrepreneurs**: `GET /api/profiles/entrepreneurs`.
- **List Investors**: `GET /api/profiles/investors`.

## Future/Planned Features
- **Messaging/Chat**: `GET /api/messages` and WebSocket integration (not yet implemented).
- **Documents**: `GET /api/documents` and file upload support.
- **Deals**: Tracking investment status.
