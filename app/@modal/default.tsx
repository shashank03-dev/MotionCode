/**
 * Fallback for the `@modal` parallel slot. Every route that isn't an active
 * intercept (i.e. everything except a soft navigation to /account or /billing)
 * resolves the slot to this, which renders nothing.
 */
export default function ModalDefault() {
  return null;
}
