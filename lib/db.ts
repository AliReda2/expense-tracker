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
      note TEXT,
      date TEXT NOT NULL
    );
  `);
}

export async function insertExpense(
    amount: number,
    note: string,
    date: string
) {
    const database = await getDB();
    if (!database) return;

    return await database.runAsync(
        `INSERT INTO expenses (amount, note, date) VALUES (?, ?, ?)`,
        [amount, note, date]
    );
}

export async function fetchExpenses() {
    const database = await getDB();
    if (!database) return [];

    return await database.getAllAsync(
        `SELECT * FROM expenses ORDER BY date DESC`
    );
}
