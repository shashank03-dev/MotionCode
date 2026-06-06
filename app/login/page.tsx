import Link from "next/link";

import { LoginForm } from "@/components/dashboard/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#11120d] px-5 py-10 text-[#fffbf4]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Link href="/" className="mb-10 font-mono text-sm text-[#d8cfbc]">
          MotionCode
        </Link>
        <div className="border border-[#56544966] bg-[#15160f] p-6 sm:p-8">
          <h1 className="font-mono text-3xl text-[#fffbf4]">Sign in</h1>
          <p className="mt-3 text-sm leading-6 text-[#b8af9d]">
            Access your workspaces, projects, and generated motion versions.
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
