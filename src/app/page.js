import { redirect } from "next/navigation";
import { isInitialized } from "@/lib/config";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialized = await isInitialized();

  if (!initialized) {
    redirect("/setup");
  }

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  redirect("/dashboard");
}
