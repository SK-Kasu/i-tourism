/**
 * Normalizes Kenyan phone numbers to 2547XXXXXXXX / 2541XXXXXXXX,
 * the format M-Pesa (Daraja) and Africa's Talking both expect.
 * Accepts: 0712345678, 712345678, +254712345678, 254 712 345 678.
 * Returns null if the number is not a valid Kenyan mobile number.
 */
function normalizePhone(input) {
  if (!input) return null;
  let p = String(input).replace(/[\s\-()]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (/^0[17]\d{8}$/.test(p)) p = "254" + p.slice(1);
  else if (/^[17]\d{8}$/.test(p)) p = "254" + p;
  return /^254[17]\d{8}$/.test(p) ? p : null;
}

module.exports = { normalizePhone };
