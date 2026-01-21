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

// Debug helpers: log every SQL statement and guard against null DB handles.
async function execAsyncSafe(label: string, sql: string) {
    const database = await getDB();
    if (!database) {
        console.warn(
            `[DB] ${label}: database is null, skipping execAsync. Platform=${Platform.OS}`,
        );
        return;
    }
    try {
        console.log(`[DB] execAsync (${label}) SQL:`); // Print SQL separately to avoid huge logs
        console.log(sql);
        return await database.execAsync(sql);
    } catch (error) {
        console.error(`[DB] execAsync (${label}) failed:`, error);
        throw error;
    }
}

async function runAsyncSafe(
    label: string,
    sql: string,
    params: (string | number | null)[] = [],
) {
    const database = await getDB();
    if (!database) {
        console.warn(
            `[DB] ${label}: database is null, skipping runAsync. Platform=${Platform.OS}`,
        );
        return;
    }
    try {
        console.log(`[DB] runAsync (${label}) SQL:`, sql, 'params:', params);
        return await database.runAsync(sql, params);
    } catch (error) {
        console.error(`[DB] runAsync (${label}) failed:`, error);
        throw error;
    }
}

async function getFirstAsyncSafe<T = any>(
    label: string,
    sql: string,
    params: (string | number | null)[] = [],
): Promise<T | null> {
    const database = await getDB();
    if (!database) {
        console.warn(
            `[DB] ${label}: database is null, skipping getFirstAsync. Platform=${Platform.OS}`,
        );
        return null;
    }
    try {
        console.log(`[DB] getFirstAsync (${label}) SQL:`, sql, 'params:', params);
        return await database.getFirstAsync<T>(sql, params);
    } catch (error) {
        console.error(`[DB] getFirstAsync (${label}) failed:`, error);
        throw error;
    }
}

async function getAllAsyncSafe<T = any>(
    label: string,
    sql: string,
    params: (string | number | null)[] = [],
): Promise<T[]> {
    const database = await getDB();
    if (!database) {
        console.warn(
            `[DB] ${label}: database is null, returning empty array from getAllAsync. Platform=${Platform.OS}`,
        );
        return [];
    }
    try {
        console.log(`[DB] getAllAsync (${label}) SQL:`, sql, 'params:', params);
        return await database.getAllAsync<T>(sql, params);
    } catch (error) {
        console.error(`[DB] getAllAsync (${label}) failed:`, error);
        throw error;
    }
}

export async function initDB() {
    await execAsyncSafe(
        'initDB:create_expenses',
        `
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
`,
    );

    await execAsyncSafe(
        'initDB:create_wallets',
        `
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD' NOT NULL 
    );
  `,
    );
}

export async function insertWallet(
    name: string,
    amount: number,
    currency: string,
) {
    return await runAsyncSafe(
        'insertWallet',
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
            const wallet = await getFirstAsyncSafe<{ amount: number }>(
                'insertExpense:select_wallet',
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
            await runAsyncSafe(
                'insertExpense:insert_row',
                `INSERT INTO expenses (amount, note, date, category, currency, walletId) VALUES (?, ?, ?, ?, ?, ?)`,
                [amount, note, date, category, currency, walletId],
            );

            // 3. Update the wallet balance
            await runAsyncSafe(
                'insertExpense:update_wallet',
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
    return await runAsyncSafe(
        'updateWallet',
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
    newWalletId: number,
) {
    const database = await getDB();
    if (!database) return;

    const oldExpense = await getFirstAsyncSafe<{
        amount: number;
        walletId: number | null;
    }>(
        'updateExpense:select_old_expense',
        `SELECT amount, walletId FROM expenses WHERE id = ?`,
        [id],
    );

    if (!oldExpense) {
        console.warn(`[DB] updateExpense: no existing expense found for id=${id}`);
        return;
    }

    const oldAmount = oldExpense.amount;
    const oldWalletId = oldExpense.walletId;

    try {
        await database.withTransactionAsync(async () => {
            // For now we require an associated wallet for every expense
            if (!newWalletId) {
                throw new Error('A wallet is required for this expense');
            }

            // Case 1: expense stays in the same wallet -> just adjust the difference
            if (oldWalletId === newWalletId) {
                const difference = newAmount - oldAmount;

                // If we are increasing the expense, ensure the wallet has enough balance
                if (difference > 0) {
                    const wallet = await getFirstAsyncSafe<{ amount: number }>(
                        'updateExpense:select_same_wallet',
                        'SELECT amount FROM wallets WHERE id = ?',
                        [newWalletId],
                    );

                    if (!wallet) {
                        throw new Error('Wallet not found');
                    }

                    if (wallet.amount < difference) {
                        throw new Error('Insufficient balance in wallet');
                    }
                }

                await runAsyncSafe(
                    'updateExpense:update_row_same_wallet',
                    `UPDATE expenses SET amount = ?, note = ?, date = ?, category = ?, currency = ? WHERE id = ?`,
                    [newAmount, note, date, category, currency, id],
                );

                if (difference !== 0) {
                    await runAsyncSafe(
                        'updateExpense:update_wallet_same_wallet',
                        `UPDATE wallets SET amount = amount - ? WHERE id = ?`,
                        [difference, newWalletId],
                    );
                }

                return;
            }

            // Case 2: moving the expense from one wallet to another
            const oldWallet =
                oldWalletId !== null
                    ? await getFirstAsyncSafe<{ amount: number }>(
                          'updateExpense:select_old_wallet',
                          'SELECT amount FROM wallets WHERE id = ?',
                          [oldWalletId],
                      )
                    : null;

            const newWallet = await getFirstAsyncSafe<{ amount: number }>(
                'updateExpense:select_new_wallet',
                'SELECT amount FROM wallets WHERE id = ?',
                [newWalletId],
            );

            if (oldWalletId !== null && !oldWallet) {
                throw new Error('Original wallet not found');
            }
            if (!newWallet) {
                throw new Error('New wallet not found');
            }

            // Ensure the new wallet has enough balance for the full new amount
            if (newWallet.amount < newAmount) {
                throw new Error('Insufficient balance in new wallet');
            }

            // 1. Update the expense row to point to the new wallet
            await runAsyncSafe(
                'updateExpense:update_row_new_wallet',
                `UPDATE expenses SET amount = ?, note = ?, date = ?, category = ?, currency = ?, walletId = ? WHERE id = ?`,
                [newAmount, note, date, category, currency, newWalletId, id],
            );

            // 2. Re-add the old amount to the old wallet (if it existed)
            if (oldWalletId !== null) {
                await runAsyncSafe(
                    'updateExpense:credit_old_wallet',
                    `UPDATE wallets SET amount = amount + ? WHERE id = ?`,
                    [oldAmount, oldWalletId],
                );
            }

            // 3. Deduct the new amount from the new wallet
            await runAsyncSafe(
                'updateExpense:debit_new_wallet',
                `UPDATE wallets SET amount = amount - ? WHERE id = ?`,
                [newAmount, newWalletId],
            );
        });
    } catch (error: any) {
        Alert.alert(
            'Transaction Failed',
            error.message || 'An unknown error occurred',
        );
        return { success: false, error };
    }
}

export async function deleteWallet(id: number) {
    return await runAsyncSafe(
        'deleteWallet',
        `DELETE FROM wallets WHERE id = ?`,
        [id],
    );
}

export async function deleteExpense(id: number) {
    const database = await getDB();
    if (!database) {
        Alert.alert('Error', 'Database not initialized');
        return { success: false };
    }

    try {
        const expense = await getFirstAsyncSafe<{
            amount: number;
            walletId: number;
        }>(
            'deleteExpense:select_expense',
            `SELECT amount, walletId FROM expenses WHERE id = ?`,
            [id],
        );

        if (!expense) {
            Alert.alert('Error', 'Expense record not found');
            return { success: false };
        }

        await database.withTransactionAsync(async () => {
            await runAsyncSafe(
                'deleteExpense:delete_row',
                `DELETE FROM expenses WHERE id = ?`,
                [id],
            );

            await runAsyncSafe(
                'deleteExpense:update_wallet',
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
    const result = await getFirstAsyncSafe<Wallet>(
        'fetchWalletById',
        'SELECT * FROM wallets WHERE id = ?',
        [id],
    );
    return result;
}

type Wallet = {
    id: number;
    name: string;
    amount: number;
    currency: string;
};

export async function fetchWallets(): Promise<Wallet[]> {
    const result = await getAllAsyncSafe<Wallet>(
        'fetchWallets',
        `SELECT * FROM wallets`,
    );
    return result;
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
        return await getAllAsyncSafe('fetchFilteredExpenses', query, params);
    } catch (error) {
        Alert.alert(`SQLite Filter Error: ${error}`);
        return [];
    }
}

export async function getDailyTotal(date: string): Promise<number> {
    const result: any = await getFirstAsyncSafe(
        'getDailyTotal',
        `SELECT ROUND(SUM(amount), 2) as total FROM expenses WHERE date = ?`,
        [date],
    );

    return result?.total || 0;
}

export async function getMonthlyTotal(monthPrefix: string): Promise<number> {
    const result: any = await getFirstAsyncSafe(
        'getMonthlyTotal',
        `SELECT ROUND(SUM(amount), 2) as total FROM expenses WHERE date LIKE ?`,
        [`${monthPrefix}%`],
    );

    return result?.total || 0;
}
