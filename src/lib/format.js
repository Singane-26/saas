/**
 * Utility functions for formatting values in the Senegalese context.
 * All amounts are in FCFA (integers, no decimals).
 */

/**
 * Format a FCFA amount with thousand separators.
 * @param {number} amount - Amount in FCFA (integer)
 * @param {boolean} [showCurrency=true] - Whether to append "F" suffix
 * @returns {string} Formatted amount, e.g. "1 250 000 F"
 */
export function formatCFA(amount, showCurrency = true) {
  if (amount == null || isNaN(amount)) return "—";
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return showCurrency ? `${formatted} F` : formatted;
}

/**
 * Format a Senegalese phone number for display.
 * @param {string} phone
 * @returns {string} e.g. "+221 77 123 45 67"
 */
export function formatPhone(phone) {
  if (!phone) return "";
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("221")) {
    const local = digits.slice(3);
    return `+221 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
  }
  return phone;
}

/**
 * Format a date for display in French locale.
 * @param {string | Date} date
 * @param {object} [options]
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  if (!date) return "";
  const d = new Date(date);
  const defaultOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  };
  return d.toLocaleDateString("fr-SN", defaultOptions);
}

/**
 * Format a date as relative time (e.g. "il y a 2 heures").
 * @param {string | Date} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return "";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return formatDate(date);
}

/**
 * Generate a sequential number with prefix.
 * @param {string} prefix - e.g. "VNT", "FAC", "CMD"
 * @param {number} sequence
 * @returns {string} e.g. "VNT-2026-00001"
 */
export function generateSequentialNumber(prefix, sequence) {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(5, "0");
  return `${prefix}-${year}-${padded}`;
}

/**
 * Create a WhatsApp deep link for messaging.
 * @param {string} phone - Phone number (international format)
 * @param {string} [message] - Pre-filled message
 * @returns {string}
 */
export function whatsappLink(phone, message = "") {
  const digits = phone.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${digits}${message ? `?text=${encodedMessage}` : ""}`;
}

/**
 * Truncate text with ellipsis.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text || "";
  return text.slice(0, maxLength) + "…";
}
