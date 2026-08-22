# Nexora HR — Frontend

> **Smart Human Resource Management System**  
> A complete, production-quality HRMS frontend built with React + Vite, backed by **Supabase**.

## ⚡ Backend setup (do this first)

This app now talks to a real Supabase backend instead of mock data. Before
running `npm install` / `npm run dev`, set it up:

1. Follow the instructions in `../backend/README.md` to create your Supabase
   project, run `backend/supabase/schema.sql`, and (optionally) seed demo data.
2. Copy `.env.example` to `.env` in this folder and fill in:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. `npm install && npm run dev`

Everything below describes the frontend itself; data is now persisted in
Postgres via Supabase, protected by Row Level Security, instead of living
only in browser memory.

---

## 📖 Project Description

Nexora HR is a commercial-quality SaaS frontend application for managing all core HR operations including employee management, attendance tracking, leave management, and payroll visibility. The application features a full role-based access control system with **Admin/HR Officer** and **Employee** views, all powered by a realistic local state simulation with mock data.

---

## ✨ Key Features

- **Zero broken buttons** — every interactive element has working frontend state
- **Accurate Clock-In/Out timer** — live elapsed time derived from actual check-in timestamp; survives browser refresh
- **Full Leave Workflow** — apply → pending → approve/reject with HR comments (single-day = 1 day correctly)
- **Shared Attendance State** — Employee clocks in → Admin sees the same record immediately
- **Role Switcher** — instantly toggle between HR Admin and Employee views in the header
- **Salary Slip Download** — generates a formatted Nexora HR pay slip text file
- **CSV Export** — export attendance logs directly from the browser
- **Payroll for all employees** — every user has payroll data and pay slip history
- **Profile always loads** — no "Employee not found" for valid logged-in users
- **Responsive Design** — works on desktop, tablet, and mobile
- **Toast Notifications** — every action provides instant visual feedback
- **Activity Feed** — Clock-in/out, leave actions, profile updates generate activity entries

---

## 🛠 Technologies Used

| Technology | Purpose |
| :--- | :--- |
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **React Router v7** | Client-side routing |
| **Tailwind CSS v4** | Utility CSS (via Vite plugin) |
| **Lucide React** | Icon library |
| **Recharts** | Charts & analytics visualizations |
| **date-fns** | Date manipulation |
| **Inter (Google Fonts)** | Typography |

---

## ⚙️ Installation

```bash
# 1. Navigate to the project directory
cd Nexora-HR-Frontend

# 2. Install all dependencies
npm install
```

---

## 🚀 Running the Project

### Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

### Production Build

```bash
npm run build
```

Built files will be in the `dist/` directory.

### Preview Production Build Locally

```bash
npm run preview
```

---

## 🗂 Folder Structure

```
Nexora-HR-Frontend/
├── public/
│   ├── favicon.svg              # Nexora HR favicon (N mark on gradient)
│   ├── logo.svg                 # Nexora HR full logo (mark + wordmark)
│   └── logo-mark.svg            # Nexora HR logo mark only
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx    # Main layout wrapper (Sidebar + Header + Outlet)
│   │   │   ├── Sidebar.jsx      # Responsive collapsible sidebar with Nexora branding
│   │   │   └── Header.jsx       # Top header with role switcher, notifications, profile
│   │   └── ui/
│   │       ├── Avatar.jsx       # User avatar component
│   │       ├── Badge.jsx        # Status badge component
│   │       ├── ConfirmDialog.jsx # Reusable confirmation dialog
│   │       ├── EmptyState.jsx   # Empty state placeholder
│   │       ├── Modal.jsx        # Reusable modal overlay
│   │       └── Toast.jsx        # Toast notification system
│   ├── context/
│   │   └── HRMSContext.jsx      # Global state store (useReducer + Context API)
│   ├── data/
│   │   └── mockData.js          # All mock users, profiles, attendance, leave, payroll + utilities
│   ├── pages/
│   │   ├── Login.jsx            # Login page with quick-access demo buttons
│   │   ├── Register.jsx         # User registration page
│   │   ├── Dashboard.jsx        # Role-aware dashboard (Employee & Admin views)
│   │   ├── Employees.jsx        # Employee directory with add/delete (Admin)
│   │   ├── Profile.jsx          # Employee profile with tabbed edit interface
│   │   ├── Attendance.jsx       # Clock In/Out + live timer + attendance log
│   │   ├── Leave.jsx            # Leave application, approval workflow
│   │   ├── Payroll.jsx          # Salary breakdown + pay slip download
│   │   └── Settings.jsx         # Notification prefs, security, preferences
│   ├── App.jsx                  # Router configuration
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global design system & CSS variables
├── index.html                   # HTML entry point with Nexora HR metadata
├── vite.config.js               # Vite configuration
├── package.json
├── package-lock.json
└── README.md
```

---

## 🔗 Available Routes

| Route | Description |
| :--- | :--- |
| `/login` | Login page (default landing) |
| `/register` | Create new account |
| `/dashboard` | Main dashboard |
| `/employees` | Employee directory (Admin) |
| `/profile` | My profile page |
| `/profile/:userId` | View any employee profile (Admin) |
| `/attendance` | Attendance tracking & logs |
| `/leave` | Leave requests & approvals |
| `/payroll` | Payroll & salary slips |
| `/settings` | Account settings |

---

## 🔑 Demo Login Credentials

The application includes preset demo accounts. Use the **Quick Demo Access** buttons on the login page or enter credentials manually:

### HR Admin Account
| Field | Value |
| :--- | :--- |
| **Email** | `admin@nexora.hr` |
| **Password** | `admin123` |
| **Access** | Full administrative access — manage employees, approve/reject leave, edit payroll, view all data |

### Employee Account
| Field | Value |
| :--- | :--- |
| **Email** | `alex@nexora.hr` |
| **Password** | `emp123` |
| **Access** | Employee self-service — clock in/out, apply for leave, view own salary & attendance |

### Additional Employee Accounts
| Name | Email | Password |
| :--- | :--- | :--- |
| Maya Patel | `maya@nexora.hr` | `emp123` |
| Carlos Rivera | `carlos@nexora.hr` | `emp123` |
| Sarah Kim | `sarah@nexora.hr` | `emp123` |
| James Wilson | `james@nexora.hr` | `emp123` |

---

## 👤 Role Explanations

### Admin / HR Officer
- View and manage the entire employee directory
- Add new employees and delete existing records
- Approve or reject employee leave requests (with comments)
- View and edit payroll/salary structures for any employee
- Monitor company-wide attendance — sees employee clock-ins in real time
- Access the Admin Dashboard with analytics and pending approvals queue
- **Role Switcher**: Use the header pill to toggle between "Admin" and "Employee" view

### Employee
- Clock in and clock out daily (with **live elapsed-time timer** accurate to the second)
- View personal attendance history and logs (record persists through state)
- Apply for Paid, Sick, or Unpaid leave — single day = 1 day (inclusive calculation)
- Track leave request status (Pending / Approved / Rejected) with HR comments
- View personal salary breakdown and download formatted Nexora HR pay slips
- Edit limited personal profile fields (phone, address, bio)

---

## 🏗 Frontend Architecture

### State Management
All application state is managed through a single **React Context + useReducer** store (`HRMSContext`):

```
Authenticated User
       ↓
Canonical User ID (e.g., "u2")
       ↓
Employee Record
  ├── profiles["u2"]      — Profile data
  ├── attendance["u2"]    — Attendance records array
  ├── payroll["u2"]       — Salary structure
  ├── paySlipHistory["u2"] — Pay slip history
  └── leaveBalance["u2"]  — Leave balance
       ↓
Shared HRMS State
       ↓
Employee UI + Admin UI (same data source)
```

### Clock-In/Out Architecture
The clock-in timestamp is stored as a Unix millisecond epoch (`checkInTs`) so:
- Live timers accurately display elapsed time without drift
- Duration is computed as `checkOut - checkInTs` in milliseconds at clock-out time
- Admin and Employee views both read the same shared attendance records

### Leave Day Calculation
The `calcLeaveDays(startDate, endDate)` utility counts **inclusive working days** (excludes weekends):
- Same day → 1 day
- Aug 23 → Aug 25 → 3 days (excluding weekend days)

---

## 📝 Notes

- Data is now persisted in a real Supabase (Postgres) database — see `../backend/`.
- Auth (login/register/password change) uses Supabase Auth.
- Access control is enforced server-side via Row Level Security, not just in the UI.
- "Add Employee" / "Delete Employee" call two Supabase Edge Functions
  (`admin-create-employee`, `admin-delete-employee`) so the privileged
  service-role key never touches the browser.
- All employees get payroll data and pay slip history rows automatically via
  a database trigger when their account is created.

---

*Built with Nexora HR · Smart Human Resource Management System*
