import type { Metadata } from "next";
import { LegalPage, SiteFooter, SiteHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Terms - MotionCode",
  description:
    "Terms notes for using MotionCode and reviewing generated motion starter code.",
};

const sections = [
  {
    title: "Use of the product",
    body: [
      "MotionCode is intended to help describe short UI motion references and draft starter snippets.",
      "You are responsible for ensuring you have the right to upload each reference and use any generated output.",
    ],
  },
  {
    title: "Generated output",
    body: [
      "Generated specs and snippets are suggestions. Review and test them before using them in a production codebase.",
      "MotionCode does not guarantee that generated code is correct, accessible, performant, or appropriate for your project without human review.",
    ],
  },
  {
    title: "Availability",
    body: [
      "The product surface may change while the project is under active development.",
      "The pricing section currently presents preview access only. Paid terms should be added before any billing flow is exposed.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "Do not use the service to submit content you are not allowed to process, to attack the system, or to disrupt other users.",
      "Operators may limit access to protect service stability or investigate abuse.",
    ],
  },
  {
    title: "No warranty",
    body: [
      "The project is provided as is, without warranties. Use the output at your own risk and validate it in your application.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#10120d]">
      <SiteHeader />
      <LegalPage
        title="Terms"
        updated="June 6, 2026"
        intro="These terms notes describe expected use of the MotionCode product surface in this repository."
        sections={sections}
      />
      <SiteFooter />
    </div>
  );
}
