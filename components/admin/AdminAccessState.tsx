import { LockKeyhole } from "lucide-react";

import { AppBackground } from "@/components/ui/app-background";
import { EmptyState } from "@/components/ui/kit";
import { ButtonLink } from "@/components/ui/site-button";

type AdminAccessStateProps = {
  message: string;
  title: string;
};

export function AdminAccessState({ message, title }: AdminAccessStateProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-canvas px-4 text-ink">
      <AppBackground />
      <div className="relative z-10 w-full max-w-lg">
        <EmptyState
          icon={<LockKeyhole className="size-5" aria-hidden="true" />}
          title={title}
          description={message}
          action={
            <ButtonLink href="/" variant="frosted" size="sm">
              Return home
            </ButtonLink>
          }
        />
      </div>
    </main>
  );
}
