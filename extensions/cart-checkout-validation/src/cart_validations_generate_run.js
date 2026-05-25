// @ts-check

/**
 * @typedef {import("../generated/api").CartValidationsGenerateRunInput} CartValidationsGenerateRunInput
 * @typedef {import("../generated/api").CartValidationsGenerateRunResult} CartValidationsGenerateRunResult
 */

/**
 * @param {CartValidationsGenerateRunInput} input
 * @returns {CartValidationsGenerateRunResult}
 */
// @ts-check

/**
 * @typedef {import("../generated/api").CartValidationsGenerateRunInput} CartValidationsGenerateRunInput
 * @typedef {import("../generated/api").CartValidationsGenerateRunResult} CartValidationsGenerateRunResult
 */

/**
 * @param {CartValidationsGenerateRunInput} input
 * @returns {CartValidationsGenerateRunResult}
 */
export function cartValidationsGenerateRun(input) {
  const errors = [];

  console.log(JSON.stringify(input));

  const buyer = input.cart.buyerIdentity?.customer;

  // B2B check — same as your working pattern
  const isB2B = buyer?.isB2B?.[0]?.hasTag === true;

  if (!isB2B) {
    return {
      operations: [{ validationAdd: { errors: [] } }],
    };
  }

  // Extract shipping address from deliveryGroups
  const deliveryAddress =
    input.cart.deliveryGroups?.[0]?.deliveryAddress ?? null;

  const shippingCountry = deliveryAddress?.countryCode?.toUpperCase() ?? null;
  const shippingState = deliveryAddress?.provinceCode?.toUpperCase() ?? null;

  console.log("Shipping to country:", shippingCountry, "state:", shippingState);

  for (const line of input.cart.lines) {
    const variant = line.merchandise;
    const product = variant.product;
    const productHandle = product.handle;
    const productTitle = product.title;

    // --- Check 1: Product is completely blocked from shipping ---
    const shippingBlocked = product.shipping_blocked?.value === "true";

    if (shippingBlocked) {
      errors.push({
        message: `"${productTitle}" cannot be shipped and is not available for purchase.`,
        target: "$.cart",
      });
      // No need to check country/state — already fully blocked
      continue;
    }

    // --- Check 2: Country restriction ---
    const restrictedCountries = product.restricted_countries?.value
      ? product.restricted_countries.value
          .split(",")
          .map((c) => c.trim().toUpperCase())
      : [];

    if (
      shippingCountry &&
      restrictedCountries.length > 0 &&
      restrictedCountries.includes(shippingCountry)
    ) {
      errors.push({
        message: `"${productTitle}" cannot be shipped to ${shippingCountry}. Please remove it from your cart.`,
        target: "$.cart",
      });
      // Still check state even if country matched? No — skip to next line
      continue;
    }

    // --- Check 3: State/Province restriction ---
    const restrictedStates = product.restricted_states?.value
      ? product.restricted_states.value
          .split(",")
          .map((s) => s.trim().toUpperCase())
      : [];

    if (
      shippingState &&
      restrictedStates.length > 0 &&
      restrictedStates.includes(shippingState)
    ) {
      errors.push({
        message: `"${productTitle}" cannot be shipped to ${shippingState}. Please remove it from your cart.`,
        target: "$.cart",
      });
    }
  }

  const operations = [
    {
      validationAdd: {
        errors,
      },
    },
  ];

  return { operations };
}
