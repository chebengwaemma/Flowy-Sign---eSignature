const KB: Array<{ keys: string[]; answer: string }> = [
  {
    keys: ["hello", "hi", "hey", "salam", "হ্যালো", "হাই"],
    answer:
      "Hi! I’m Flowy Assist. Ask me how to send a signature, buy a plan, use fax, invite your team, or download a signed document.",
  },
  {
    keys: ["sign", "signature", "send", "স্বাক্ষর", "সিগনেচার", "সাইন"],
    answer:
      "To send for signature: Documents → New request → upload your file → Add signers (name, email, signature style) → Place fields → Send. Each signer gets a secure link. They can type a styled name or upload a signature image.",
  },
  {
    keys: ["style", "font", "italic", "bold", "slant", "স্টাইল", "ফন্ট"],
    answer:
      "On Add signers, type the person’s name and pick a signature style: Script, Bold, Italic, Slant, or Crossed. When they open the sign link they can keep that style or upload an image instead.",
  },
  {
    keys: ["download", "ডাউনলোড", "completed", "signed document"],
    answer:
      "When everyone has signed, open the document and tap Download signed document. Image files download as PNG; text/PDF downloads as a signed HTML copy. The original file stays unchanged — signatures are overlays only.",
  },
  {
    keys: ["plan", "pricing", "billing", "stripe", "subscription", "প্ল্যান", "কিন", "upgrade", "free"],
    answer:
      "You need a paid plan to send signatures. Free cannot send. Starter, Pro, and Business each include a monthly signature limit. Open Billing to buy a package.",
  },
  {
    keys: ["fax", "ফ্যাক্স"],
    answer:
      "Open Fax, enter the destination number, attach or pick a completed document, then Send fax. Inbound faxes show in the same inbox when fax is enabled for your workspace.",
  },
  {
    keys: ["team", "invite", "member", "টিম", "ইনভাইট"],
    answer:
      "Go to Team → Invite. Enter an email and role (admin or member). Seat limits follow your plan — upgrade if you need more teammates.",
  },
  {
    keys: ["admin", "brand", "color", "অ্যাডমিন"],
    answer:
      "Workspace admins open Admin to edit brand name, colors, landing copy, and toggles like chatbot or fax. Platform super-admins use /admin for site-wide settings.",
  },
  {
    keys: ["password", "login", "account", "লগইন"],
    answer:
      "Sign in at Login, or create a workspace from Sign up. Demo accounts: admin@flowysign.com / admin123 and user@flowysign.com / user123.",
  },
  {
    keys: ["pdf", "image", "upload", "screenshot", "আপলোড"],
    answer:
      "You can upload PDF, images (PNG/JPG), or text. Place signature fields on the preview. When someone signs, marks sit on top — your original file is not rewritten.",
  },
  {
    keys: ["help", "what can", "কী করতে", "সাহায্য"],
    answer:
      "I can explain signing, signature styles, downloads, plans & limits, fax, team invites, and admin settings. Try: “How do I send a document?” or “What is on the Free plan?”",
  },
];

export function answerChat(message: string): string {
  const lower = message.toLowerCase().trim();
  if (!lower) {
    return "Type a question and I’ll answer right away.";
  }

  const scored = KB.map((item) => ({
    item,
    score: item.keys.reduce((n, k) => (lower.includes(k.toLowerCase()) ? n + 1 : n), 0),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored[0]) return scored[0].item.answer;

  return "Got it. I can help with signing documents, signature styles, downloads, plans, fax, team, or billing. Try asking “How do I send for signature?” or “How do plans work?”";
}
