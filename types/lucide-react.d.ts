declare module "lucide-react" {
  import type * as React from "react";

  export type LucideProps = React.SVGProps<SVGSVGElement> & {
    absoluteStrokeWidth?: boolean;
    size?: number | string;
  };

  export const ArrowRight: React.FC<LucideProps>;
  export const ArrowUpRight: React.FC<LucideProps>;
  export const BarChart3: React.FC<LucideProps>;
  export const Check: React.FC<LucideProps>;
  export const CreditCard: React.FC<LucideProps>;
  export const Download: React.FC<LucideProps>;
  export const Loader2: React.FC<LucideProps>;
  export const Shield: React.FC<LucideProps>;
  export const Sparkles: React.FC<LucideProps>;
  export const Trash2: React.FC<LucideProps>;
  export const UserRound: React.FC<LucideProps>;
}
