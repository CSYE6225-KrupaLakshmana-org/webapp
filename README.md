# webapp
# Cloud-Native Web Application - Assignment 02

## Overview
This project implements a **cloud-native web application backend** for Assignment-02 of CSYE6225.  
It focuses on **RESTful APIs**, **user authentication**, and **product management**.  
The application is built with **Node.js** and **Express**, with **JWT-based authentication** and **JSON file storage**.

### Features Implemented
- **User Management**
  - Create user account (Sign Up) with email, password, first name, last name
  - Passwords are securely stored using **bcrypt hashing**
  - Account timestamps: `account_created`, `account_updated`
  - Login to generate **JWT tokens** for authentication
  - Get user information (excluding password) using JWT authentication
  - Update user information (first name, last name, password)
- **Product Management**
  - Add, update, and delete products
  - Product quantity cannot be negative
  - Only the user who added a product can update or delete it
- **Security**
  - Token-based authentication (JWT)
  - Protected routes require `Authorization: Bearer <JWT_TOKEN>`
- **Error Handling**
  - Proper HTTP status codes for success and failure
  - Returns `400` for bad requests (e.g., updating restricted fields or duplicate email)
  - Returns `401` for unauthorized access (invalid/missing token)
  - Returns `404` for not found resources

---

## Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)
- Git
- Postman or any API testing tool

---

## Setup Instructions

1. **Clone your forked repository**
   ```bash
   git clone git@github.com:Krupa-lakshmana/webapp.git
   cd webapp

## Install dependencies

   **npm install


## Environment variables
Create a .env file in the root:

JWT_SECRET=mysecretkey
PORT=3000


## Start the development server

   **npm run dev


   **Server will run at http://localhost:3000

   ## API Endpoints
User Endpoints
| Method | URL             | Description                  | Auth |
| ------ | --------------- | ---------------------------- | ---- |
| POST   | `/users`        | Create a new user            | No   |
| POST   | `/users/login`  | Login and generate JWT token | No   |
| GET    | `/users/:email` | Get user information         | Yes  |
| PUT    | `/users/:email` | Update user information      | Yes  |
| PATCH  | `/users/:email` | Partial update of user       | Yes  |

## Product Endpoints
| Method | URL             | Description               | Auth             |
| ------ | --------------- | ------------------------- | ---------------- |
| POST   | `/products`     | Add a product             | Yes              |
| PUT    | `/products/:id` | Update a product          | Yes (owner only) |
| PATCH  | `/products/:id` | Partial update of product | Yes (owner only) |
| DELETE | `/products/:id` | Delete a product          | Yes (owner only) |

{
    "id": 1759178256459,
    "email": "Sebastian_Stanton@hotmail.com",
    "first_name": "Jordan",
    "last_name": "Harvey",
    "account_created": "2025-09-29T20:37:36.459Z",
    "account_updated": "2025-09-29T20:37:36.459Z"
}