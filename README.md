# ThreatLens

AI-powered cybersecurity intelligence and phishing awareness platform built with React, Express, PostgreSQL, Prisma, and AI-assisted threat analysis.

ThreatLens helps users:

* detect phishing and scam content
* analyze suspicious URLs, emails, and messages
* understand cyber threats using AI explanations
* train cybersecurity awareness through interactive simulations

---

# Overview

ThreatLens is a full-stack cybersecurity platform designed to simulate a modern Security Operations Center (SOC) experience.

The platform combines:

* hybrid heuristic threat detection
* AI-generated analyst explanations
* interactive phishing simulations
* threat intelligence dashboards
* OTP-secured authentication
* PostgreSQL-backed analytics

ThreatLens focuses on both:

* threat detection
* cybersecurity awareness training

---

# Features

## Threat Scanner

Analyze:

* suspicious URLs
* phishing emails
* scam SMS / chat messages
* spam text
* suspicious website descriptions

ThreatLens detects:

* phishing attacks
* credential harvesting
* impersonation attempts
* crypto scams
* malware delivery
* social-engineering tactics
* urgency manipulation
* giveaway scams

Each scan includes:

* threat score
* confidence score
* risk classification
* detected indicators
* AI analyst explanation
* recommended actions

---

## Threat Simulation Lab

Interactive cybersecurity training environment where users investigate simulated cyber attacks.

Simulation types include:

* phishing emails
* fake login pages
* SMS scams
* crypto wallet scams
* malware invoice attacks

Users can:

* inspect suspicious indicators
* identify attack patterns
* review mitigation guidance
* receive awareness scoring
* analyze AI-generated debriefs

---

## Threat Intelligence Feed

Interactive intelligence feed containing:

* phishing campaigns
* scam trends
* threat alerts
* analyst summaries
* IOC-style indicators
* mitigation guidance

---

## AI Analyst Engine

ThreatLens uses AI to explain:

* why content is suspicious
* manipulation techniques used
* detected threat indicators
* recommended mitigation steps

Supports:

* OpenAI
* Google Gemini
* structured fallback analysis

---

## OTP Authentication System

Secure OTP-based authentication with:

* email verification
* bcrypt password hashing
* PostgreSQL persistence
* resend functionality
* cooldown handling
* verification auditing

---

# Tech Stack

## Frontend

* React 19
* Vite
* TypeScript
* Tailwind CSS
* Framer Motion
* React Router
* Recharts
* Axios

## Backend

* Node.js
* Express.js
* TypeScript
* Prisma ORM
* JWT Authentication
* Zod Validation
* Nodemailer

## Database

* PostgreSQL

## AI Integration

* OpenAI API
* Google Gemini API

---

# Project Architecture

```text
Frontend (React + Vite)
        ↓
Express API (Node.js)
        ↓
Hybrid Threat Engine
(Rule Heuristics + AI Narratives)
        ↓
Prisma ORM
        ↓
PostgreSQL Database
```

---

# Example Threat Scenarios

## Phishing URL

```text
http://paypaI-security-verification-login.xyz/update-account
```

Expected:

* MALICIOUS
* credential harvesting
* impersonation indicators

---

## Crypto Wallet Scam

```text
Your crypto wallet has been compromised. Verify your recovery phrase immediately.
```

Expected:

* MALICIOUS
* seed phrase theft
* social-engineering attack

---

## Giveaway Scam

```text
Congratulations! Claim your iPhone by paying ₹99.
```

Expected:

* HIGH
* financial bait
* scam giveaway pattern

---

# How To Use

## 1. Create an Account

* Sign up using your email
* Verify account using OTP
* Login securely

## 2. Scan Suspicious Content

Use Threat Scanner to analyze:

* URLs
* emails
* messages
* website descriptions

## 3. Explore Threat Simulation Lab

Interact with simulated attacks and identify:

* phishing indicators
* fake login pages
* malware delivery attempts
* social-engineering tactics

## 4. Review Threat Intelligence

Track:

* recent threat alerts
* scam trends
* analyst insights
* mitigation guidance

---

# Running Locally

## Prerequisites

* Node.js 20+
* PostgreSQL
* npm

---

## Clone Repository

```bash
git clone YOUR_REPOSITORY_URL
cd ThreatLens
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment Variables

### apps/api/.env

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/threatlens
PORT=4000
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

OPENAI_API_KEY=
GEMINI_API_KEY=

EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_google_app_password
SMTP_FROM=ThreatLens <yourgmail@gmail.com>
```

### apps/web/.env

```env
VITE_API_URL=http://localhost:4000
```

---

## Setup Database

```bash
npm run db:push
npm run db:seed
```

---

## Start Application

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:4000
```

---

# Deployment

## Frontend

Recommended:

* Vercel

## Backend

Recommended:

* Render

## Database

Recommended:

* Render PostgreSQL
* Neon

---

# Security Features

* JWT authentication
* OTP verification
* Password hashing with bcrypt
* Input validation with Zod
* Threat scoring
* Confidence analysis
* Risk classification
* Secure environment configuration

---

# Future Improvements

* live threat intelligence APIs
* browser extension integration
* real-time phishing feeds
* email attachment sandboxing
* multi-user collaboration
* advanced SOC analytics

---

# License

This project is for educational and portfolio purposes.
