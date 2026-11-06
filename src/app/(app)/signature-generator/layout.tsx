import { signatureFontsClassName } from "@/components/signature/signature-fonts";

export default function SignatureGeneratorLayout({ children }: { children: React.ReactNode }) {
  return <div className={signatureFontsClassName}>{children}</div>;
}
