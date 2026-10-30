import { redirect } from "next/navigation";

export default function AdminSignupDisabledPage() {
  redirect("/admin/login");
}
