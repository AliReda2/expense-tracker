export const formatMoney = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
    }).format(amount);
};
