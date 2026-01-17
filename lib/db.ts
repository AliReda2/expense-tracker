import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDB() {
    if (Platform.OS === 'web') return null;
    if (!db) {
        db = await SQLite.openDatabaseAsync('expenses.db');
    }
    return db;
}

export async function initDB() {
    const database = await getDB();
    if (!database) return;

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      note TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT DEFAULT 'General'
    );
  `);
    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    amount REAL NOT NULL
    );
  `);
}

// --- INSERT OPERATIONS ---

export async function insertWallet(name: string, amount: number) {
    const database = await getDB();
    if (!database) return;

    return await database.runAsync(
        `INSERT INTO wallets (name,amount) VALUES (?, ?)`,
        [name, amount]
    );
}

export async function insertExpense(
    amount: number,
    note: string,
    date: string,
    category: string
) {
    const database = await getDB();
    if (!database) return;

    return await database.runAsync(
        `INSERT INTO expenses (amount, note, date, category) VALUES (?, ?, ?, ?)`,
        [amount, note, date, category]
    );
}

// --- UPDATE OPERATIONS ---

export async function updateWallet(id: number, name: string, amount: number) {
    const database = await getDB();
    if (!database) return;

    return await database.runAsync(
        `UPDATE wallets SET amount = ?, name = ? WHERE id = ?`,
        [amount, name, id]
    );
}

export async function updateExpense(
    id: number,
    amount: number,
    note: string,
    date: string,
    category: string
) {
    const database = await getDB();
    if (!database) return;

    return await database.runAsync(
        `UPDATE expenses SET amount = ?, note = ?, date = ?, category = ? WHERE id = ?`,
        [amount, note, date, category, id]
    );
}

// --- DELETE OPERATIONS ---

export async function deleteWallet(id: number) {
    const database = await getDB();
    if (!database) return;

    return await database.runAsync(`DELETE FROM wallets WHERE id = ?`, [id]);
}
export async function deleteExpense(id: number) {
    const database = await getDB();
    if (!database) return;

    return await database.runAsync(`DELETE FROM expenses WHERE id = ?`, [id]);
}

// --- FETCH OPERATIONS ---

export async function fetchWalletById(id: number) {
    const database = await getDB();
    if (!database) return null; // Or [] depending on your preference

    // Use '?' as a placeholder to prevent SQL injection
    // The library safely escapes the value of 'id'
    return await database.getFirstAsync('SELECT * FROM wallets WHERE id = ?', [
        id,
    ]);
}
type Wallet = {
  id: number;
  name: string;
  amount: number;
};

export async function fetchWallets():Promise<Wallet[]> {
    const database = await getDB();
    if (!database) return [];

    // Use getAllAsync to retrieve rows
    return await database.getAllAsync(`SELECT * FROM wallets`);
}

export async function fetchFilteredExpenses(filters: {
    startDate?: string;
    endDate?: string;
    category?: string;
    minAmount?: number;
}) {
    const database = await getDB();
    if (!database) return [];

    let query = `SELECT * FROM expenses WHERE 1=1`;
    const params: (string | number)[] = []; // Use explicit types

    // 1. Check Date filters (ensure they aren't empty strings)
    if (filters.startDate && filters.startDate.length > 0) {
        query += ` AND date >= ?`;
        params.push(filters.startDate);
    }
    if (filters.endDate && filters.endDate.length > 0) {
        query += ` AND date <= ?`;
        params.push(filters.endDate);
    }

    // 2. Check Category (ignore 'All')
    if (filters.category && filters.category !== 'All') {
        query += ` AND category = ?`;
        params.push(filters.category);
    }

    // 3. Strict check for minAmount (avoids pushing NaN or undefined)
    if (
        filters.minAmount !== undefined &&
        filters.minAmount !== null &&
        !isNaN(filters.minAmount)
    ) {
        query += ` AND amount >= ?`;
        params.push(filters.minAmount);
    }

    query += ` ORDER BY date DESC`;

    try {
        // This is where the NullPointerException usually happens
        // We ensure 'params' only contains valid strings or numbers
        return await database.getAllAsync(query, params);
    } catch (error) {
        console.error('SQLite Filter Error:', error);
        return []; // Return empty list rather than crashing
    }
}

/**
 * Calculates the total expenses for a specific date.
 * @param date - Format: YYYY-MM-DD
 */
export async function getDailyTotal(date: string): Promise<number> {
    const database = await getDB();
    if (!database) return 0;

    // We use ROUND to mitigate floating point errors (e.g., 1.1 + 2.2 = 3.30000003)
    const result: any = await database.getFirstAsync(
        `SELECT ROUND(SUM(amount), 2) as total FROM expenses WHERE date = ?`,
        [date]
    );

    return result?.total || 0;
}

/**
 * Calculates the total expenses for a specific month.
 * @param monthPrefix - Format: YYYY-MM (e.g., "2023-10")
 */
export async function getMonthlyTotal(monthPrefix: string): Promise<number> {
    const database = await getDB();
    if (!database) return 0;

    // Uses the LIKE operator to match any date starting with "YYYY-MM"
    const result: any = await database.getFirstAsync(
        `SELECT ROUND(SUM(amount), 2) as total FROM expenses WHERE date LIKE ?`,
        [`${monthPrefix}%`]
    );

    return result?.total || 0;
}
