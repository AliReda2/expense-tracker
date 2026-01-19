import * as SQLite from 'expo-sqlite';
import { Alert, Platform } from 'react-native';

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
    category TEXT DEFAULT 'General',
    currency TEXT DEFAULT 'USD',
    walletId INTEGER,
    FOREIGN KEY (walletId) REFERENCES wallets (id)
  );
`);

    await database.execAsync(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD' NOT NULL 
    );
  `);
}

export async function insertWallet(
    name: string,
    amount: number,
    currency: string,
) {
    const database = await getDB();
    if (!database) return;

    return await database.runAsync(
        `INSERT INTO wallets (name,amount,currency) VALUES (?, ?,?)`,
        [name, amount, currency],
    );
}

export async function insertExpense(
    amount: number,
    note: string,
    date: string,
    category: string,
    walletId: number,
    currency: string = 'USD',
) {
    const database = await getDB();
    if (!database) {
        throw new Error('Database not initialized');
    }

    try {
        await database.withTransactionAsync(async () => {
            // 1. Check if wallet has enough balance
            const wallet = await database.getFirstAsync<{ amount: number }>(
                'SELECT amount FROM wallets WHERE id = ?',
                [walletId],
            );

            if (!wallet) {
                throw new Error('Wallet not found');
            }

            if (wallet.amount < amount) {
                throw new Error('Insufficient balance in wallet');
            }

            // 2. Insert the expense
            await database.runAsync(
                `INSERT INTO expenses (amount, note, date, category, currency, walletId) VALUES (?, ?, ?, ?, ?, ?)`,
                [amount, note, date, category, currency, walletId],
            );

            // 3. Update the wallet balance
            await database.runAsync(
                `UPDATE wallets SET amount = amount - ? WHERE id = ?`,
                [amount, walletId],
            );
        });

        return { success: true };
    } catch (error: any) {
        Alert.alert(
            'Transaction Failed',
            error.message || 'An unknown error occurred',
        );
        return { success: false, error };
    }
}

export async function updateWallet(
    id: number,
    name: string,
    amount: number,
    currency: string,
) {
    const database = await getDB();
    if (!database) return;

    return await database.runAsync(
        `UPDATE wallets SET amount = ?, name = ?, currency = ? WHERE id = ?`,
        [amount, name, currency, id],
    );
}

export async function updateExpense(
    id: number,
    newAmount: number,
    note: string,
    date: string,
    category: string,
    currency: string,
    walletId: number,
) {
    const database = await getDB();
    if (!database) return;

    const oldExpense: any = await database.getFirstAsync(
        `SELECT amount FROM expenses WHERE id = ?`,
        [id],
    );

    if (!oldExpense) return;

    return await database.withTransactionAsync(async () => {
        await database.runAsync(
            `UPDATE expenses SET amount = ?, note = ?, date = ?, category = ?, currency = ? WHERE id = ?`,
            [newAmount, note, date, category, currency, id],
        );

        const difference = newAmount - oldExpense.amount;
        await database.runAsync(
            `UPDATE wallets SET amount = amount - ? WHERE id = ?`,
            [difference, walletId],
        );
    });
}

export async function deleteWallet(id: number) {
    const database = await getDB();
    if (!database) return;

    return await database.runAsync(`DELETE FROM wallets WHERE id = ?`, [id]);
}

export async function deleteExpense(id: number) {
    const database = await getDB();
    if (!database) {
        Alert.alert('Error', 'Database not initialized');
        return { success: false };
    }

    try {
        const expense = await database.getFirstAsync<{
            amount: number;
            walletId: number;
        }>(`SELECT amount, walletId FROM expenses WHERE id = ?`, [id]);

        if (!expense) {
            Alert.alert('Error', 'Expense record not found');
            return { success: false };
        }

        await database.withTransactionAsync(async () => {
            await database.runAsync(`DELETE FROM expenses WHERE id = ?`, [id]);

            await database.runAsync(
                `UPDATE wallets SET amount = amount + ? WHERE id = ?`,
                [expense.amount, expense.walletId],
            );
        });

        return { success: true };
    } catch (error: any) {
        Alert.alert(
            'Delete Failed',
            error.message || 'An unexpected error occurred',
        );
        return { success: false, error };
    }
}

export async function fetchWalletById(id: number): Promise<Wallet | null> {
    const database = await getDB();
    if (!database) return null;

    return await database.getFirstAsync('SELECT * FROM wallets WHERE id = ?', [
        id,
    ]);
}

type Wallet = {
    id: number;
    name: string;
    amount: number;
    currency: string;
};

export async function fetchWallets(): Promise<Wallet[]> {
    const database = await getDB();
    if (!database) return [];

    return await database.getAllAsync(`SELECT * FROM wallets`);
}

export async function fetchFilteredExpenses(filters: {
    startDate?: string;
    endDate?: string;
    category?: string;
}) {
    const database = await getDB();
    if (!database) return [];

    let query = `SELECT * FROM expenses WHERE 1=1`;
    const params: (string | number)[] = [];

    if (filters.startDate && filters.startDate.length > 0) {
        query += ` AND date >= ?`;
        params.push(filters.startDate);
    }
    if (filters.endDate && filters.endDate.length > 0) {
        query += ` AND date <= ?`;
        params.push(filters.endDate);
    }

    if (filters.category && filters.category !== 'All') {
        query += ` AND category = ?`;
        params.push(filters.category);
    }

    query += ` ORDER BY date DESC`;

    try {
        return await database.getAllAsync(query, params);
    } catch (error) {
        Alert.alert(`SQLite Filter Error: ${error}`);
        return [];
    }
}

export async function getDailyTotal(date: string): Promise<number> {
    const database = await getDB();
    if (!database) return 0;

    const result: any = await database.getFirstAsync(
        `SELECT ROUND(SUM(amount), 2) as total FROM expenses WHERE date = ?`,
        [date],
    );

    return result?.total || 0;
}

export async function getMonthlyTotal(monthPrefix: string): Promise<number> {
    const database = await getDB();
    if (!database) return 0;

    const result: any = await database.getFirstAsync(
        `SELECT ROUND(SUM(amount), 2) as total FROM expenses WHERE date LIKE ?`,
        [`${monthPrefix}%`],
    );

    return result?.total || 0;
}
