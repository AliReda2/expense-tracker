# Expense Tracker (Expo + React Native)

A cross-platform personal finance app built with Expo, React Native, and TypeScript. It lets you manage multiple wallets in different currencies, track categorized expenses, and visualize your daily and monthly spending.

This project is designed to showcase my ability to:

- Model data and business rules in a local SQLite database.
- Build polished mobile UI with React Native Paper and custom components.
- Implement charts, filters, and navigation using modern Expo tooling.

---

## Features

**Core product features**

- **Multi‑wallet support** – Create separate wallets (e.g. Cash, Bank, Savings) with their own balances.
- **Per‑wallet currencies** – Each wallet stores its currency; amounts are formatted using `Intl.NumberFormat`.
- **Expense CRUD** – Add, edit, and delete expenses with amount, note, date, category, wallet, and currency.
- **Category filters** – Filter expenses by category on both the home dashboard and list view (Food, Transport, Bills, Entertainment, Loan, General).
- **Daily & monthly summaries** – See aggregated totals for "Today" and "This Month" on the home screen.
- **Monthly spending chart** – Visual bar chart of daily spending for the current month (`react-native-chart-kit`).
- **Swipe actions** – Swipe left on an expense row to reveal a destructive delete action (`react-native-gesture-handler`).
- **Pull‑to‑refresh** – Consistent refresh behavior across home, wallets, and expense list screens.

**Data & reliability**

- **Local persistence with SQLite** – Uses `expo-sqlite` with a dedicated data-access layer in `lib/db.ts`.
- **Relational schema** – `wallets` and `expenses` tables linked by foreign key (`walletId`).
- **Transactional updates** – Adding, editing, or deleting an expense runs inside SQLite transactions so wallet balances always stay in sync.
- **Serverless / offline‑first** – All data lives on-device, no backend required.

---

## Tech Stack

- **Framework:** Expo + React Native (`expo-router` for navigation)
- **Language:** TypeScript with `strict` mode
- **UI:** React Native Paper, custom components, gesture-based interactions
- **Data:** `expo-sqlite` for persistence, SQL queries encapsulated in `lib/db.ts`
- **Charts:** `react-native-chart-kit` for the monthly spending chart
- **Utilities:** `date-fns` for date formatting and ranges

---

## Project Structure (High Level)

- `app/_layout.tsx` – Root layout, initializes SQLite (`initDB`) and configures the navigation stack.
- `app/index.tsx` – Home dashboard: wallet overview, daily/monthly totals, filters, and the `MonthlyChart` component.
- `app/add/index.tsx` – Screen for adding a new expense, including wallet, currency, category, and validation.
- `app/edit/index.tsx` – Screen for editing an existing expense while keeping wallet balances consistent.
- `app/view/index.tsx` – List view of expenses with filters and swipe-to-delete via `SwipeableExpenseRow`.
- `app/wallets/*` – Wallet management (list, add, edit, delete) with currency selection.
- `components/WalletsContainer.tsx` – Wallet summary cards used on the home dashboard.
- `components/MonthlyChart.tsx` – Monthly bar chart visualizing daily spending.
- `components/SwipeableExpenseRow.tsx` – Reusable swipeable row wrapping an `ExpenseCard` component.
- `lib/db.ts` – SQLite schema definition and data-access layer (queries, transactions, filtered fetches, aggregates).
- `utils/formatMoney.ts` – Currency-aware money formatting helper.

---

## Running the Project Locally

### Prerequisites

- Node.js and npm
- Expo tooling (`npx expo` will be installed on-demand)
- iOS Simulator (macOS), Android emulator, or the Expo Go app on a physical device

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the Expo dev server**

   ```bash
   npm run start
   ```

3. **Run on a device or simulator**

   From the Expo Dev Tools or CLI output you can choose to:

   - Open in **Expo Go** on a physical device
   - Launch an **Android** emulator: `npm run android`
   - Launch an **iOS** simulator (macOS): `npm run ios`
   - Run in the browser: `npm run web`

4. **Lint the project (optional)**

   ```bash
   npm run lint
   ```

---

## What This Project Demonstrates

From an engineering perspective, this app highlights:

- Working with **typed React Native + TypeScript** in a strict configuration.
- Designing a **small relational schema** in SQLite and enforcing business rules (wallet balances) via transactions.
- Building **reusable UI components** (wallet container, swipeable rows, chart wrapper) and composing them into screens.
- Using **Expo Router** for file-based navigation and screen layout.
- Implementing **data visualization** and filters for a better UX around financial data.

If youd like to discuss the implementation details or potential extensions (budgets, recurring expenses, cloud sync, authentication, etc.), Im happy to walk through the code.
