// @ts-check

/**
 * @typedef {import("../generated/api").CartValidationsGenerateRunInput} CartValidationsGenerateRunInput
 * @typedef {import("../generated/api").CartValidationsGenerateRunResult} CartValidationsGenerateRunResult
 * @typedef {import("../generated/api").Input} Input
 */

// ── Configuration ──────────────────────────────────────────
const MAX_QUANTITY_PER_LINE = 10;

// ── Main validation function ───────────────────────────────

/**
 * @param {CartValidationsGenerateRunInput} input
 * @returns {CartValidationsGenerateRunResult}
 */
export function preorderAvailability(input) {
  const now = getCurrentUTCDate();
  const errors = [];

  for (const line of input.cart.lines) {
     // ── Validation 1: Max quantity per line ───────────────
     if (line.quantity > MAX_QUANTITY_PER_LINE) {
       errors.push(buildError(
         `You cannot order more than ${MAX_QUANTITY_PER_LINE} of the same item.`
       ));
       continue; // Skip preorder checks if quantity is excessive
     }

     // ── Validation 2: Preorder / availability dates ───────
     const merchandise = line.merchandise;
     if (!merchandise?.product) continue;
     const { product } = merchandise;
     const productTitle = product.title;

     const availableFromRaw = product.availableFrom?.value ?? null;
     const availabelUntilRaw = product.availableUntil?.value ?? null;

     if(availableFromRaw != null) {
      const availableFrom = parseUTCDate(availableFromRaw);
      if(!isValidDate(availableFrom)) {
        errors.push(buildError(`"${productTitle}" has an invalid availability date configured. Please contact support.`));
        continue;
      }
      if(now < availableFrom) {
        errors.push(buildError(`"${productTitle}" is not available yet. It launches on ${formatDate(availableFrom)}.`));
        continue;
      }
    }

    if(availabelUntilRaw !== null) {
      const availableUntil = parseUTCDate(availabelUntilRaw);
      if(!isValidDate(availableUntil)) {
        errors.push(buildError(`"${productTitle}" has an invalid availability date configured. Please contact support.`));
        continue;
      }
      if(now > availableUntil) {
        errors.push(buildError(`"${productTitle}" is no longer available. It was available until ${formatDate(availableUntil)}.`));
        continue;
      }
    }
  } // end for each cart line

  // ── Build result ─────────────────────────────────────────

  const operations = [
    {
      validationAdd: {
        errors
      },
    },
  ];

  return { operations };

}
function getCurrentUTCDate() {
  return new Date();
}

function parseUTCDate(dateString) {
  return new Date(dateString);
}

function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

function formatDate(date){
  return date.toLocaleString('en-US', {
    timeZone: 'UTC',
    hour:"numeric",
    minute:"2-digit",
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZoneName: 'short'
  });

  }

  function buildError(message){
    return {
     message: message,
     target: "cart"
    }
}