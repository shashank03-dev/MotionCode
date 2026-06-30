import { RouteModal } from "@/components/app/RouteModal";
import { BillingContent } from "@/components/billing/BillingContent";

export const dynamic = "force-dynamic";

/**
 * Intercepts a soft navigation to /billing from anywhere in the app and renders
 * the Billing surface as a modal over the current page. A hard load of /billing
 * bypasses this and renders the standalone page.
 */
export default function BillingModal() {
  return (
    <RouteModal title="Billing">
      <BillingContent />
    </RouteModal>
  );
}
