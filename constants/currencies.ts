export const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar', rateToDollar: 1 },
    { code: 'EUR', symbol: '€', name: 'Euro', rateToDollar: 0.92 },
    { code: 'GBP', symbol: '£', name: 'British Pound', rateToDollar: 0.79 },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToDollar: 151.6 },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rateToDollar: 1450.0 },
    { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound', rateToDollar: 89500.0 },
];

export function convertToUSD(amount: number, currencyCode: string): number {
    const currency = CURRENCIES.find((c) => c.code === currencyCode);
    if (!currency || currency.rateToDollar === 0) return amount;

    // Calculate and round to 2 decimal places
    return parseFloat((amount / currency.rateToDollar).toFixed(2));
}
