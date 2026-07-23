import { LockKeyhole } from "lucide-react";

import { EmptyState } from "@/components/ui/kit";
import { ButtonLink } from "@/components/ui/site-button";

export function SupportAccessState() {
  return (
    <div className="mx-auto max-w-lg">
      <EmptyState
        icon={<LockKeyhole className="size-5" aria-hidden="true" />}
        title="Sign in required"
        description="MotionCode support tickets are available once your account is authenticated."
        action={
          <ButtonLink href="/login" variant="primary" size="sm">
            Sign in
          </ButtonLink>
        }
      />
    </div>
  );
}
