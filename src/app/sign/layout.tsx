import { signatureFontsClassName } from "@/components/signature/signature-fonts";

export default function SignLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${signatureFontsClassName} min-h-full`}>{children}</div>;
}
