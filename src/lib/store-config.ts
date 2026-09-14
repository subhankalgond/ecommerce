/**
 * Shared store configuration used by both the client (cart UI) and the
 * server (payment routes) so the shipping rule can never drift.
 */

/** Free shipping applies from this subtotal (paise). ₹999 = 99900 */
export const FREE_SHIPPING_THRESHOLD = 99900;

/** Flat shipping fee below the threshold (paise). ₹99 = 9900 */
export const SHIPPING_FEE = 9900;

/** Shipping charge for a given subtotal in paise (0 when free) */
export function getShipping(subtotal: number): number {
  return subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD
    ? 0
    : SHIPPING_FEE;
}
