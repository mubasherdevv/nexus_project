# Nexus API Documentation

This document provides a comprehensive overview of the available API endpoints for the Nexus Platform.

## Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/register` | Register a new user (Entrepreneur/Investor) | No |
| POST | `/login` | Login and receive JWT token | No |
| POST | `/verify-2fa` | Verify 2FA OTP after login | No |
| POST | `/logout` | Logout user and set offline status | Yes |
| GET | `/me` | Get current authenticated user details | Yes |
| PUT | `/profile` | Update basic user profile (name, bio) | Yes |
| PUT | `/toggle-2fa` | Enable/Disable 2FA for the user | Yes |

## Profiles (`/api/profiles`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/entrepreneurs` | List all entrepreneurs | Yes |
| GET | `/investors` | List all investors | Yes |
| GET | `/:id` | Get specific user profile (User ID) | Yes |

## Meetings (`/api/meetings`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/` | Schedule a new pitch/meeting | Yes |
| GET | `/` | Get all meetings for the user | Yes |
| PATCH | `/:id/status` | Accept/Reject/Cancel a meeting | Yes |

## Documents (`/api/documents`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/upload` | Upload a new document (PDF/Image) | Yes |
| GET | `/` | Get documents associated with the user | Yes |
| POST | `/:id/sign` | Digitally sign a document | Yes |

## Payments & Wallet (`/api/payments`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/wallet` | Get balance and recent transactions | Yes |
| POST | `/deposit` | Mock deposit funds into wallet | Yes |
| POST | `/withdraw` | Mock withdraw funds from wallet | Yes |
| POST | `/transfer` | Peer-to-peer fund transfer by email | Yes |
| GET | `/history` | Full transaction history | Yes |

---

## Security Headers
All protected routes require an `Authorization` header in the format:
`Authorization: Bearer <JWT_TOKEN>`

## Error Handling
The API returns standard HTTP status codes:
- `200/201`: Success
- `400`: Bad Request (Validation Error)
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error
