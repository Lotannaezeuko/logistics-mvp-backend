# Logistics MVP Platform

This is the backend for a **logistics platform MVP** that connects manufacturers, haulers, freight forwarders, and logistics companies. The platform allows users to post transport jobs, view available jobs, book them, and process payments upon job completion.

---

## 🔧 Features (MVP Scope)

* ✅ **Role-based authentication** (4 user types)
* ✅ Post new transport jobs
* ✅ View available jobs (filtered per role)
* ✅ Book a job
* ✅ Payment triggered upon job completion
* ✅ **RESTful API design**
* ✅ PostgreSQL as the database
* ⚙️ **Stripe integration** (test mode)

---

## 👥 User Roles

* **Manufacturer**: Posts jobs to transport goods.
* **Hauler**: Offers vehicle and books jobs.
* **Freight Forwarder**: Matches transport needs with carriers or posts/assigns jobs.
* **Logistics Company**: Oversees operations or posts/assigns jobs.

---
## 📦 Project Structure
```
logistics-mvp-backend/
├── controllers/        # API logic (auth, jobs, bookings, payments)
├── models/             # DB schemas
├── routes/             # API endpoints
├── middleware/         # Auth, role checks
├── services/           # Payment logic, booking logic
├── config/             # DB and environment config
├── utils/              # Helpers
├── app.js              # Express config
└── server.js           # Main server entry point
```
---

## 🚀 API Overview (MVP)

| Method | Endpoint             | Description                           |
| :----- | :------------------- | :------------------------------------ |
| `POST` | `/auth/signup`       | Register user (role-based)            |
| `POST` | `/auth/login`        | Login and get JWT token               |
| `POST` | `/jobs`              | Post a new job (authenticated)        |
| `GET`  | `/jobs`              | View open jobs                        |
| `POST` | `/jobs/:id/book`     | Book a job                            |
| `POST` | `/jobs/:id/complete` | Mark job as completed & pay out       |

---

## 💳 Payments

Stripe test mode enabled. Payment is triggered once a job is marked as complete by the booker. Each job stores payment intent and completion status.

---

## 🛠️ Tech Stack

* **Node.js** + **Express**
* **PostgreSQL** + Sequelize
* **JWT Authentication**
* **Stripe API**

---

## 🚀 Getting Started

``` bash
git clone [https://github.com/lotannaezeuko/logistics-mvp-backend.git]
cd logistics-mvp-backend
npm install
npm run dev

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/logistics_mvp
DB_HOST=localhost
DB_PORT=5432
DB_NAME=logistics_mvp
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Server
PORT=3000
NODE_ENV=development

# CORS (if needed)
FRONTEND_URL=http://localhost:3001

```

## 📈 Future Roadmap

While this repo focuses on the MVP, future additions include:

- Warehouse management  
- Carbon emission tracking  
- Route optimization  
- Real-time GPS tracking  
- Notifications  
- Road & bridge condition reporting  
- Smart job matching for urgent deliveries  

---

## 🧠 Author

Built by **Lotanna Ezeuko**