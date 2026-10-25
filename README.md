# DeptPay 🎓

**Departmental Receipt Verification & Bookkeeping Portal**  
Built specifically for **LAUTECH Chemical Engineering (CHE 300L)** to eliminate WhatsApp DM clutter, prevent manual bookkeeping errors, and generate print-ready Excel lists for course lecturers.

---

## 🚀 Key Features

### For Coursemates (Student Portal)
- **Instant Bank Details & 1-Click Copy**: Account number, bank name, and exact amount shown clearly.
- **Client-Side Image Compression**: Automatically compresses mobile screenshot receipts (from ~3MB down to ~200KB) to ensure rapid uploads over mobile networks.
- **Duplicate Prevention**: Prevents double submissions for the same matric number.
- **"Check My Status" Tracker**: Coursemates can enter their matric number at any time to verify whether their payment has been confirmed, pending, or rejected without messaging the Class Rep.
- **Celebration Feedback**: Confetti burst & clear confirmation summary upon submission.

### For Class Rep (Admin Control Center)
Protected Access: Reps sign in with a Supabase Auth account. Public signups are disabled — only accounts created by the class admin can access the dashboard.
- **Real-Time Collections Metrics**: Total verified amount (₦), count of verified students, and pending queue counter.
- **High-Resolution Receipt Inspector**: View transfer receipts side-by-side with student details.
- **One-Click Approval & Rejection**: Approve with 1 click, or reject with preset reasons (*"Amount mismatch"*, *"Blurry screenshot"*, *"Duplicate reference"*).
- **Direct Excel Export**: Download a sorted, formatted `.xlsx` file containing S/N, Matric Number, Full Name, Payment Item, Amount, and Date—ready to hand to the lecturer or HOD!
- **Campaign Creator**: Easily add new manual, textbook, or association fee collections.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **Backend / Database**: Supabase (PostgreSQL, Storage Buckets, Row Level Security)
- **File Processing**: `browser-image-compression`, `xlsx` (SheetJS)
- **Build Tool**: Vite 8

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

> **Note:** DeptPay runs out-of-the-box in **Demo Sandbox Mode** with pre-populated Chemical Engineering 300L mock data. You can test all features immediately!

### 3. Connect Live Supabase (When Ready)
1. Create a free project on [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and run the script in [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy your project URL and Anon Key into a `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart the Vite server (`npm run dev`).
