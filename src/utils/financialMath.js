/**
 * ==============================================================================
 * FinancialMath: Deterministic High-Precision Fixed-Point Arithmetic Utility
 * ==============================================================================
 * Replaces IEEE-754 floating-point math with exact BigInt scaled fixed-point
 * arithmetic. Implements standard financial ROUND_HALF_UP rounding (half away from zero).
 *
 * Guaranteed Properties:
 * 1. Zero binary floating-point representation drift (0.1 + 0.2 === 0.30).
 * 2. Exact financial ROUND_HALF_UP rounding to 2 decimal places for currency
 *    and 4 decimal places for interest rates.
 * 3. Single-step rounding without intermediate precision loss.
 * 4. Exact negative value and zero handling (no "-0.00").
 * 5. String-based inputs and outputs matching MySQL DECIMAL types.
 */

const SCALE = 6; // Internal calculation scale: 6 decimal places (guard digits)
const MULTIPLIER = 10n ** BigInt(SCALE);
const MONEY_DECIMALS = 2;
const RATE_DECIMALS = 4;

/**
 * Parses any numeric or string representation into a scaled BigInt
 * @param {string|number} val
 * @returns {bigint}
 */
function toScaledBigInt(val) {
  if (val === null || val === undefined || val === "") return 0n;
  const str = String(val).trim();
  const isNegative = str.startsWith("-");
  const cleanStr = isNegative ? str.slice(1) : str;

  const parts = cleanStr.split(".");
  const integerPart = parts[0] || "0";
  let fractionalPart = parts[1] || "";

  if (fractionalPart.length > SCALE) {
    fractionalPart = fractionalPart.slice(0, SCALE);
  } else {
    fractionalPart = fractionalPart.padEnd(SCALE, "0");
  }

  const combined = BigInt(integerPart) * MULTIPLIER + BigInt(fractionalPart);
  return isNegative ? -combined : combined;
}

/**
 * Formats a scaled BigInt into an exact decimal string with ROUND_HALF_UP rounding
 * @param {bigint} scaledVal
 * @param {number} targetDecimals
 * @returns {string}
 */
function fromScaledBigInt(scaledVal, targetDecimals = 2) {
  const isNegative = scaledVal < 0n;
  let absVal = isNegative ? -scaledVal : scaledVal;

  const shift = SCALE - targetDecimals;
  if (shift > 0) {
    const divisor = 10n ** BigInt(shift);
    const half = divisor / 2n;
    // ROUND_HALF_UP: add half before truncating integer division
    absVal = (absVal + half) / divisor;
  }

  const targetDivisor = 10n ** BigInt(targetDecimals);
  const intPart = absVal / targetDivisor;
  const fracPart = absVal % targetDivisor;

  const fracStr = fracPart.toString().padStart(targetDecimals, "0");
  const result = `${intPart.toString()}.${fracStr}`;
  // Avoid negative zero
  return isNegative && absVal > 0n ? `-${result}` : result;
}

export const FinancialMath = {
  SCALE,
  MONEY_DECIMALS,
  RATE_DECIMALS,

  /**
   * Parse and format value to exact 2-decimal currency string (ROUND_HALF_UP)
   */
  toMoney(val) {
    return fromScaledBigInt(toScaledBigInt(val), MONEY_DECIMALS);
  },

  /**
   * Parse and format value to exact 4-decimal rate string (ROUND_HALF_UP)
   */
  toRate(val) {
    return fromScaledBigInt(toScaledBigInt(val), RATE_DECIMALS);
  },

  /**
   * Exact Decimal Addition (a + b)
   */
  add(a, b) {
    const sum = toScaledBigInt(a) + toScaledBigInt(b);
    return fromScaledBigInt(sum, MONEY_DECIMALS);
  },

  /**
   * Exact Decimal Subtraction (a - b)
   */
  sub(a, b) {
    const diff = toScaledBigInt(a) - toScaledBigInt(b);
    return fromScaledBigInt(diff, MONEY_DECIMALS);
  },

  /**
   * Exact Decimal Multiplication (a * b) with single-step ROUND_HALF_UP
   */
  mul(a, b, decimals = MONEY_DECIMALS) {
    const aScaled = toScaledBigInt(a);
    const bScaled = toScaledBigInt(b);
    // aScaled * bScaled has scale (SCALE * 2) = 12
    const totalScale = SCALE * 2;
    const shift = totalScale - decimals;
    const divisor = 10n ** BigInt(shift);
    const half = divisor / 2n;

    const rawProduct = aScaled * bScaled;
    const isNegative = rawProduct < 0n;
    let absVal = isNegative ? -rawProduct : rawProduct;
    absVal = (absVal + half) / divisor;

    const targetDivisor = 10n ** BigInt(decimals);
    const intPart = absVal / targetDivisor;
    const fracPart = absVal % targetDivisor;
    const fracStr = fracPart.toString().padStart(decimals, "0");
    const result = `${intPart.toString()}.${fracStr}`;
    return isNegative && absVal > 0n ? `-${result}` : result;
  },

  /**
   * Exact Decimal Division (a / b) with single-step ROUND_HALF_UP
   */
  div(a, b, decimals = MONEY_DECIMALS) {
    const bScaled = toScaledBigInt(b);
    if (bScaled === 0n) throw new Error("Division by zero in FinancialMath.div");
    const aScaled = toScaledBigInt(a);

    // Scale dividend up by extra digits for exact rounding
    const shift = BigInt(decimals + 1);
    const factor = 10n ** shift;
    const unroundedQuotient = (aScaled * factor) / bScaled;

    const isNegative = unroundedQuotient < 0n;
    let absVal = isNegative ? -unroundedQuotient : unroundedQuotient;
    // Round half up on the last digit (5)
    absVal = (absVal + 5n) / 10n;

    const targetDivisor = 10n ** BigInt(decimals);
    const intPart = absVal / targetDivisor;
    const fracPart = absVal % targetDivisor;
    const fracStr = fracPart.toString().padStart(decimals, "0");
    const result = `${intPart.toString()}.${fracStr}`;
    return isNegative && absVal > 0n ? `-${result}` : result;
  },

  /**
   * Calculate Interest Accrual Amount
   * Formula:
   *   Fixed: rate formatted as currency
   *   Percentage: (principal * rate) / 100 with exact ROUND_HALF_UP to 2 decimal places
   * @param {string|number} principal
   * @param {string|number} rate
   * @param {'percentage'|'fixed'} interestType
   * @returns {string} Exact currency string (e.g. "2000.00")
   */
  calculateInterest(principal, rate, interestType = "percentage") {
    if (interestType === "fixed") {
      return this.toMoney(rate);
    }
    const pScaled = toScaledBigInt(principal);
    const rScaled = toScaledBigInt(rate);
    // (pScaled * rScaled) has scale 12. Percentage divides by 100.
    // Total scale before rounding is 12 + 2 = 14 or rawProduct / 100n at scale 12.
    const rawNumerator = (pScaled * rScaled) / 100n;
    const totalScale = SCALE * 2;
    const shift = totalScale - MONEY_DECIMALS;
    const divisor = 10n ** BigInt(shift);
    const half = divisor / 2n;

    const isNegative = rawNumerator < 0n;
    let absVal = isNegative ? -rawNumerator : rawNumerator;
    absVal = (absVal + half) / divisor;

    const targetDivisor = 10n ** BigInt(MONEY_DECIMALS);
    const intPart = absVal / targetDivisor;
    const fracPart = absVal % targetDivisor;
    const fracStr = fracPart.toString().padStart(MONEY_DECIMALS, "0");
    const result = `${intPart.toString()}.${fracStr}`;
    return isNegative && absVal > 0n ? `-${result}` : result;
  },

  /**
   * Exact Numeric Comparisons
   */
  eq(a, b) {
    return toScaledBigInt(a) === toScaledBigInt(b);
  },

  gt(a, b) {
    return toScaledBigInt(a) > toScaledBigInt(b);
  },

  gte(a, b) {
    return toScaledBigInt(a) >= toScaledBigInt(b);
  },

  lt(a, b) {
    return toScaledBigInt(a) < toScaledBigInt(b);
  },

  lte(a, b) {
    return toScaledBigInt(a) <= toScaledBigInt(b);
  },

  maxZero(val) {
    const scaled = toScaledBigInt(val);
    return scaled < 0n ? "0.00" : fromScaledBigInt(scaled, MONEY_DECIMALS);
  },
};

export default FinancialMath;
