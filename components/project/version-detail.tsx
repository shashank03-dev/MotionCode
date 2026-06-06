import type { VersionPageData } from "@/app/dashboard/data";

type VersionDetailProps = {
  data: VersionPageData;
};

export function VersionDetail({ data }: VersionDetailProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-lg text-[#fffbf4]">
          v{data.version.version_number}
        </h2>
        <div className="text-sm text-[#8f887a]">
          {data.version.label ?? data.version.id}
        </div>
      </div>
      <pre className="max-h-[560px] overflow-auto border border-[#56544966] bg-[#15160f] p-4 font-mono text-xs leading-6 text-[#d8cfbc]">
        {JSON.stringify(data.version.motion_spec, null, 2)}
      </pre>
    </section>
  );
}
