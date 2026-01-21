import { convertToUSD, CURRENCIES } from '@/constants/currencies';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db: SQLite.SQLiteDatabase | null = null;

// 1. Add this variable to track initialization status
let initPromise: Promise<void> | null = null;

export async function getDB() {
    if (Platform.OS === 'web') return null;
    if (!db) {
        db = await SQLite.openDatabaseAsync('expenses.db');
    }
    return db;
}

// Helper to clean parameters before they hit the native bridge
const sanitizeParams = (params: (string | number | null | undefined)[]) =>
    params.map((p) => (p === undefined ? null : p));

async function execAsyncSafe(label: string, sql: string) {
    const database = await getDB();
    if (!database) {
        console.warn(
            `[DB] ${label}: database is null, skipping execAsync. Platform=${Platform.OS}`,
        );
        return;
    }
    try {
        console.log(`[DB] execAsync (${label}) SQL:`);
        console.log(sql);
        return await database.execAsync(sql);
    } catch (error) {
        console.error(`[DB] execAsync (${label}) failed:`, error);
        // We don't throw here to prevent the UI from crashing,
        // but you can keep the throw if you want the caller to handle it.
        throw error;
    }
}

async function runAsyncSafe(
    label: string,
    sql: string,
    params: (string | number | null | undefined)[] = [],
) {
    const database = await getDB();
    if (!database) {
        console.warn(
            `[DB] ${label}: database is null, skipping runAsync. Platform=${Platform.OS}`,
        );
        return;
    }

    const cleanParams = sanitizeParams(params);

    try {
        console.log(`[DB] runAsync (${label}) SQL:`, sql, 'params:', cleanParams);
        return await database.runAsync(sql, cleanParams);
    } catch (error) {
        console.error(`[DB] runAsync (${label}) failed:`, error);
        throw error;
    }
}

async function getFirstAsyncSafe<T = any>(
    label: string,
    sql: string,
    params: (string | number | null | undefined)[] = [],
): Promise<T | null> {
    const database = await getDB();
    if (!database) {
        console.warn(`[DB] ${label}: database is null. Platform=${Platform.OS}`);
        return null;
    }

    const sanitizedParams = sanitizeParams(params);

    try {
        console.log(
            `[DB] getFirstAsync (${label}) SQL:`,
            sql,
            'params:',
            sanitizedParams,
        );
        return await database.getFirstAsync<T>(sql, sanitizedParams);
    } catch (error) {
        console.error(`[DB] getFirstAsync (${label}) failed:`, error);
        throw error;
    }
}

async function getAllAsyncSafe<T = any>(
    label: string,
    sql: string,
    params: (string | number | null | undefined)[] = [],
): Promise<T[]> {
    const database = await getDB();
    if (!database) {
        console.warn(
            `[DB] ${label}: database is null, returning empty array from getAllAsync. Platform=${Platform.OS}`,
        );
        return [];
    }

    const cleanParams = sanitizeParams(params);

    try {
        console.log(
            `[DB] getAllAsync (${label}) SQL:`,
            sql,
            'params:',
            cleanParams,
        );
        return await database.getAllAsync<T>(sql, cleanParams);
    } catch (error) {
        console.error(`[DB] getAllAsync (${label}) failed:`, error);
        throw error;
    }
}

export async function initDB() {
    // 2. Prevent double execution
    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        // 3. Ensure tables exist first
        await execAsyncSafe(
            'initDB:create_wallets',
            `CREATE TABLE IF NOT EXISTS wallets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                amount REAL NOT NULL,
                dollarAmount REAL NOT NULL,
                currency TEXT DEFAULT 'USD' NOT NULL 
            );`,
        );

        await execAsyncSafe(
            'initDB:create_expenses',
            `CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                dollarAmount REAL NOT NULL,
                note TEXT NOT NULL,
                date TEXT NOT NULL,
                walletId INTEGER,
                FOREIGN KEY (walletId) REFERENCES wallets (id)
            );`,
        );

        // 4. Run Migrations
        await migrateTableColumns();
    })();

    return initPromise;
}

async function migrateTableColumns() {
    const database = await getDB();
    if (!database) return;

    try {
        // --- Expenses Table Migrations ---
        const expenseColumns = await getAllAsyncSafe(
            'migrate:check_expenses',
            'PRAGMA table_info(expenses)',
        );
        const expenseColNames = expenseColumns.map((col: any) => col.name);

        const expenseMigrations = [
            {
                name: 'category',
                sql: "ALTER TABLE expenses ADD COLUMN category TEXT DEFAULT 'General';",
            },
            {
                name: 'currency',
                sql: "ALTER TABLE expenses ADD COLUMN currency TEXT DEFAULT 'USD';",
            },
            {
                name: 'dollarAmount',
                sql: 'ALTER TABLE expenses ADD COLUMN dollarAmount REAL DEFAULT 0.0 NOT NULL;',
            },
        ];

        for (const mig of expenseMigrations) {
            if (!expenseColNames.includes(mig.name)) {
                console.log(`[DB] Migrating: Adding ${mig.name} to expenses`);
                await database.execAsync(mig.sql);
            }
        }

        // --- Wallets Table Migrations ---
        const walletColumns = await getAllAsyncSafe(
            'migrate:check_wallets',
            'PRAGMA table_info(wallets)',
        );
        const walletColNames = walletColumns.map((col: any) => col.name);

        const walletMigrations = [
            {
                name: 'currency',
                sql: "ALTER TABLE wallets ADD COLUMN currency TEXT DEFAULT 'USD' NOT NULL;",
            },
            {
                name: 'dollarAmount',
                sql: 'ALTER TABLE wallets ADD COLUMN dollarAmount REAL DEFAULT 0.0 NOT NULL;',
            },
        ];

        for (const mig of walletMigrations) {
            if (!walletColNames.includes(mig.name)) {
                console.log(`[DB] Migrating: Adding ${mig.name} to wallets`);
                await database.execAsync(mig.sql);
            }
        }

        console.log('[DB] Database schema is up to date.');
    } catch (error) {
        console.error('[DB] Migration failed:', error);
    }
}

export async function insertWallet(
    name: string,
    amount: number,
    currency: string,
) {
    const dollarAmount = await convertToUSD(amount, currency);
    return await runAsyncSafe(
        'insertWallet',
        `INSERT INTO wallets (name, amount, currency, dollarAmount) VALUES (?, ?, ?, ?)`,
        [name, amount, currency, dollarAmount],
    );
}

export async function insertExpense(
    amount: number,
    note: string,
    date: string,
    category: string,
    walletId: number,
    expenseCurrency: string = 'USD', // The currency of the transaction
) {
    const database = await getDB();
    if (!database) {
        console.error('[DB] insertExpense: Database not initialized');
        return { success: false };
    }

    try {
        // 1. Get the Dollar equivalent for the expense (for global reports)
        const expenseInUSD = await convertToUSD(amount, expenseCurrency);

        await database.withTransactionAsync(async () => {
            // 2. Fetch the wallet details (needed to check currency and balance)
            const wallet = await getFirstAsyncSafe<{
                amount: number;
                currency: string;
            }>(
                'insertExpense:select_wallet',
                'SELECT amount, currency FROM wallets WHERE id = ?',
                [walletId],
            );

            if (!wallet) throw new Error('Wallet not found');

            // 3. Convert the expense amount into the WALLET'S local currency
            // Formula: (Amount in USD) * (Wallet's rate to USD)
            const walletCurrencyObj = CURRENCIES.find(
                (c) => c.code === wallet.currency,
            );
            if (!walletCurrencyObj)
                throw new Error(`Unknown wallet currency: ${wallet.currency}`);

            const amountInWalletCurrency =
                expenseInUSD * walletCurrencyObj.rateToDollar;

            // 4. Validate Balance using the wallet's currency units
            if (wallet.amount < amountInWalletCurrency) {
                throw new Error(
                    `Insufficient balance. Need ${amountInWalletCurrency.toLocaleString()} ${wallet.currency}`,
                );
            }

            // 5. Insert Expense (Save the original spent amount and the USD normalized amount)
            await runAsyncSafe(
                'insertExpense:insert_row',
                `INSERT INTO expenses (amount, dollarAmount, note, date, category, currency, walletId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [amount, expenseInUSD, note, date, category, expenseCurrency, walletId],
            );

            // 6. Update Wallet: Deduct the amount converted to the wallet's currency
            await runAsyncSafe(
                'insertExpense:update_wallet',
                `UPDATE wallets SET amount = amount - ?, dollarAmount = dollarAmount - ? WHERE id = ?`,
                [amountInWalletCurrency, expenseInUSD, walletId],
            );
        });

        return { success: true };
    } catch (error: any) {
        console.error('[DB] Transaction Failed:', error.message || error);
        return { success: false, error: error.message };
    }
}

export async function updateWallet(
    id: number,
    name: string,
    amount: number,
    currency: string,
) {
    const dollarAmount = await convertToUSD(amount, currency);

    return await runAsyncSafe(
        'updateWallet',
        `UPDATE wallets SET amount = ?, dollarAmount = ?, name = ?, currency = ? WHERE id = ?`,
        [amount, dollarAmount, name, currency, id],
    );
}

export async function updateExpense(
    id: number,
    newAmount: number,
    note: string,
    date: string,
    category: string,
    expenseCurrency: string,
    newWalletId: number,
) {
    const database = await getDB();
    if (!database) {
        console.error('[DB] updateExpense: Database not initialized');
        return { success: false };
    }

    try {
        // 1. Fetch old expense AND the currency of the old wallet
        const oldData = await getFirstAsyncSafe<{
            amount: number;
            dollarAmount: number;
            walletId: number;
            walletCurrency: string;
        }>(
            'updateExpense:select_old_data',
            `SELECT e.amount, e.dollarAmount, e.walletId, w.currency as walletCurrency 
             FROM expenses e 
             JOIN wallets w ON e.walletId = w.id 
             WHERE e.id = ?`,
            [id],
        );

        if (!oldData) throw new Error('Existing expense or wallet not found');

        // 2. Prepare new values
        const newDollarAmount = await convertToUSD(newAmount, expenseCurrency);

        await database.withTransactionAsync(async () => {
            // CASE 1: WALLET REMAINS THE SAME
            if (oldData.walletId === newWalletId) {
                const walletRate =
                    CURRENCIES.find((c) => c.code === oldData.walletCurrency)
                        ?.rateToDollar || 1;

                // Calculate difference in wallet's local currency
                const dollarDiff = newDollarAmount - oldData.dollarAmount;
                const localAmountDiff = dollarDiff * walletRate;

                // Check balance if the expense increased
                if (localAmountDiff > 0) {
                    const wallet = await getFirstAsyncSafe<{ amount: number }>(
                        'check_bal',
                        'SELECT amount FROM wallets WHERE id = ?',
                        [newWalletId],
                    );
                    if (!wallet || wallet.amount < localAmountDiff)
                        throw new Error('Insufficient balance in wallet');
                }

                await runAsyncSafe(
                    'updateExpense:row_same_wallet',
                    `UPDATE expenses SET amount = ?, dollarAmount = ?, note = ?, date = ?, category = ?, currency = ? WHERE id = ?`,
                    [
                        newAmount,
                        newDollarAmount,
                        note,
                        date,
                        category,
                        expenseCurrency,
                        id,
                    ],
                );

                await runAsyncSafe(
                    'updateExpense:wallet_same_wallet',
                    `UPDATE wallets SET amount = amount - ?, dollarAmount = dollarAmount - ? WHERE id = ?`,
                    [localAmountDiff, dollarDiff, newWalletId],
                );
            } else {
                // CASE 2: CHANGING WALLETS
                const newWallet = await getFirstAsyncSafe<{
                    amount: number;
                    currency: string;
                }>(
                    'select_new_wallet',
                    'SELECT amount, currency FROM wallets WHERE id = ?',
                    [newWalletId],
                );
                if (!newWallet) throw new Error('New wallet not found');

                const oldWalletRate =
                    CURRENCIES.find((c) => c.code === oldData.walletCurrency)
                        ?.rateToDollar || 1;
                const newWalletRate =
                    CURRENCIES.find((c) => c.code === newWallet.currency)?.rateToDollar ||
                    1;

                const refundAmountLocal = oldData.dollarAmount * oldWalletRate;
                const deductAmountLocal = newDollarAmount * newWalletRate;

                if (newWallet.amount < deductAmountLocal)
                    throw new Error('Insufficient balance in new wallet');

                // Update Expense Row
                await runAsyncSafe(
                    'updateExpense:row_new_wallet',
                    `UPDATE expenses SET amount = ?, dollarAmount = ?, note = ?, date = ?, category = ?, currency = ?, walletId = ? WHERE id = ?`,
                    [
                        newAmount,
                        newDollarAmount,
                        note,
                        date,
                        category,
                        expenseCurrency,
                        newWalletId,
                        id,
                    ],
                );

                // Refund Old Wallet
                await runAsyncSafe(
                    'updateExpense:refund_old',
                    `UPDATE wallets SET amount = amount + ?, dollarAmount = dollarAmount + ? WHERE id = ?`,
                    [refundAmountLocal, oldData.dollarAmount, oldData.walletId],
                );

                // Deduct New Wallet
                await runAsyncSafe(
                    'updateExpense:deduct_new',
                    `UPDATE wallets SET amount = amount - ?, dollarAmount = dollarAmount - ? WHERE id = ?`,
                    [deductAmountLocal, newDollarAmount, newWalletId],
                );
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error('[DB] Update Failed:', error.message || error);
        return { success: false, error: error.message };
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
        console.error('[DB] deleteExpense: Database not initialized');
        return { success: false };
    }

    try {
        // 1. Fetch the expense AND the wallet's currency info
        // We join with wallets to know how to convert the USD back to the wallet's local units
        const data = await getFirstAsyncSafe<{
            amount: number; // The original amount spent (e.g., 10 USD)
            dollarAmount: number; // The USD equivalent (e.g., 10.00)
            walletId: number;
            walletCurrency: string;
        }>(
            'deleteExpense:select_expense_with_wallet',
            `SELECT e.amount, e.dollarAmount, e.walletId, w.currency as walletCurrency 
             FROM expenses e 
             JOIN wallets w ON e.walletId = w.id 
             WHERE e.id = ?`,
            [id],
        );

        if (!data) {
            console.error(
                '[DB] deleteExpense: Expense record or associated wallet not found',
            );
            return { success: false };
        }

        // 2. Find the rate for the wallet's currency
        const walletCurrencyObj = CURRENCIES.find(
            (c) => c.code === data.walletCurrency,
        );
        if (!walletCurrencyObj)
            throw new Error(`Unknown wallet currency: ${data.walletCurrency}`);

        // 3. Calculate how much to refund in the wallet's local currency
        // We use the dollarAmount (the source of truth) multiplied by the wallet's rate
        const refundAmountLocal =
            data.dollarAmount * walletCurrencyObj.rateToDollar;

        await database.withTransactionAsync(async () => {
            // 4. Delete the expense
            await runAsyncSafe(
                'deleteExpense:delete_row',
                `DELETE FROM expenses WHERE id = ?`,
                [id],
            );

            // 5. Refund the wallet
            // We refund the calculated local amount and the exact dollarAmount
            await runAsyncSafe(
                'deleteExpense:update_wallet',
                `UPDATE wallets SET amount = amount + ?, dollarAmount = dollarAmount + ? WHERE id = ?`,
                [refundAmountLocal, data.dollarAmount, data.walletId],
            );
        });

        return { success: true };
    } catch (error: any) {
        console.error('[DB] Delete Failed:', error.message || error);
        return { success: false, error: error.message };
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
    dollarAmount: number;
    currency: string;
};

export async function fetchWallets(): Promise<Wallet[]> {
    const result = await getAllAsyncSafe<Wallet>(
        'fetchWallets',
        `SELECT * FROM wallets`,
    );
    return result;
}

export async function fetchFilteredExpenses(filters: { category?: string }) {
    const database = await getDB();
    if (!database) return [];

    let query = `SELECT * FROM expenses WHERE 1=1`;
    const params: (string | number | null | undefined)[] = [];

    if (filters.category && filters.category !== 'All') {
        query += ` AND category = ?`;
        params.push(filters.category);
    }

    query += ` ORDER BY date DESC`;

    try {
        return await getAllAsyncSafe('fetchFilteredExpenses', query, params);
    } catch (error) {
        console.error(`[DB] SQLite Filter Error: ${error}`);
        return [];
    }
}

export async function getDailyTotal(date: string): Promise<number> {
    if (!date) {
        console.warn('[DB] getDailyTotal: date is missing');
        return 0;
    }

    // Changed SUM(amount) to SUM(dollarAmount) to support mixed currencies
    const result: any = await getFirstAsyncSafe(
        'getDailyTotal',
        `SELECT ROUND(SUM(dollarAmount), 2) as total FROM expenses WHERE date = ?`,
        [date],
    );

    return result?.total || 0;
}

export async function getMonthlyTotal(monthPrefix: string): Promise<number> {
    if (!monthPrefix) {
        console.warn('[DB] getMonthlyTotal: monthPrefix is missing');
        return 0;
    }

    // Changed SUM(amount) to SUM(dollarAmount)
    const result: any = await getFirstAsyncSafe(
        'getMonthlyTotal',
        `SELECT ROUND(SUM(dollarAmount), 2) as total FROM expenses WHERE date LIKE ?`,
        [`${monthPrefix}%`],
    );

    return result?.total || 0;
}
