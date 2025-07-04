import Dinero from 'dinero.js';

const CURRENCY_SCALE = 100; // For 2 decimal places

export const formatCurrency = (
  amount: number,
  currency: string = 'SGD'
): string => {
  try {
    const dineroAmount = Dinero({
      amount: Math.round(amount * CURRENCY_SCALE),
      currency: currency.toUpperCase() as any,
    });

    return dineroAmount.toFormat('$0,0.00');
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
};

export const formatCurrencyCompact = (
  amount: number,
  currency: string = 'SGD'
): string => {
  const absAmount = Math.abs(amount);
  let suffix = '';
  let dividedAmount = amount;

  if (absAmount >= 1000000) {
    dividedAmount = amount / 1000000;
    suffix = 'M';
  } else if (absAmount >= 1000) {
    dividedAmount = amount / 1000;
    suffix = 'K';
  }

  return `${currency.toUpperCase()} ${dividedAmount.toFixed(1)}${suffix}`;
};

export const parseCurrencyAmount = (value: string): number => {
  // Remove currency symbols and formatting
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};

export const validateCurrencyCode = (code: string): boolean => {
  const validCodes = ['SGD', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CNY', 'HKD', 'MYR', 'THB', 'INR'];
  return validCodes.includes(code.toUpperCase());
};