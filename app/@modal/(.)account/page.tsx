import { AccountContent } from "@/components/account/AccountContent";
import { RouteModal } from "@/components/app/RouteModal";

export const dynamic = "force-dynamic";

/**
 * Intercepts a soft navigation to /account from anywhere in the app and renders
 * the Account surface as a modal over the current page. A hard load of /account
 * bypasses this and renders the standalone page.
 */
export default function AccountModal() {
  return (
    <RouteModal title="Account">
      <AccountContent />
    </RouteModal>
  );
}
