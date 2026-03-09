import { redirect } from "next/navigation";

export default function LandingPage() {
  // Redirect to login page - users need to authenticate first
  redirect("/login");
}
