# Project Specification: Personal Financial Dashboard & Expense/Income Tracker

## 1. Core Concept
A web-based financial tracker and analytics dashboard using **Google Sheets as the primary database**—allowing users to perform effortless bulk edits directly inside Google Sheets—paired with **Google OAuth 2.0** for user authentication.

---

## 2. Authentication & Scopes
* **Auth Provider:** Google OAuth 2.0
* **Required Scopes:**
  * `https://www.googleapis.com/auth/drive.file` *(Recommended)* — Least-privilege access restricted strictly to files created by the app or explicitly selected by the user.
  * `https://www.googleapis.com/auth/spreadsheets` *(Optional)* — Full read/write access to all user spreadsheets if broader access is needed.
* **Note on Verification:** Up to 100 test users can use the app in *Testing* mode via Google Cloud Console without undergoing Google's formal OAuth app verification process.

---

## 3. Database Setup & Connection Flow
1. **Create New Database:**
   * Trigger `spreadsheets.create` (Google Sheets API v4) to initialize a new spreadsheet from a predefined schema/template.
   * **Default Columns:** `Date`, `Type`, `Category`, `Amount`, `Notes`.
2. **Connect Existing Database:**
   * Integrate the **Google Picker API** so users can browse and select an existing spreadsheet from their Google Drive.
3. **State Persistence:**
   * Store the active `spreadsheetId` in `localStorage` (for client-only setups) or a lightweight user-preferences store mapped to the user's Google account.

---

## 4. CRUD Operations & Data Handling
* **Read (`spreadsheets.values.get`):**
  * Fetch sheet rows and map values dynamically by **header name (Row 1)** rather than static column indices so manual column reordering in Sheets does not break parsing.
* **Create (`spreadsheets.values.append`):**
  * Append new income/expense transactions directly to the target sheet.
* **Bulk Edit Sync & Rate Limits:**
  * Users perform bulk edits directly in the Google Sheets UI.
  * Implement client-side caching paired with a manual **Sync / Refresh** button to respect Google Sheets API quotas (~60–100 requests per minute per user).

---

## 5. Frontend Architecture Options

| Criteria | Option A: React.js (Vite SPA) | Option B: Next.js (Full-Stack) |
| :--- | :--- | :--- |
| **Execution Model** | 100% Client-side (zero backend) | Client + Server (API Routes / Server Actions) |
| **OAuth Flow** | Implicit Flow (`@react-oauth/google`); `access_token` expires every 1 hour, requiring periodic re-auth | Authorization Code Flow (`NextAuth.js` / `Auth.js`); securely stores `refresh_token` server-side for persistent, auto-refreshing sessions |
| **API Latency** | Direct Browser $\rightarrow$ Google API calls | Browser $\rightarrow$ Next.js Server $\rightarrow$ Google API (or direct client calls using session token) |
| **Hosting** | Free static hosting (Vercel, Netlify, Cloudflare Pages) | Serverless hosting (subject to function cold starts/limits on free tiers) |
| **Best For** | Fast MVP, personal tool, zero infrastructure cost | Seamless SaaS UX, persistent sessions, future server-side cron jobs (e.g., email summaries) |