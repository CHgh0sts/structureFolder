import { redirect } from "next/navigation";
import { isInitialized, getAppConfig, getRules, getProcessedFilesCount } from "@/lib/config";
import { getSession } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const initialized = await isInitialized();
  if (!initialized) redirect("/setup");

  const session = await getSession();
  if (!session) redirect("/login");

  const [config, rules, processedCount] = await Promise.all([
    getAppConfig(),
    getRules(),
    getProcessedFilesCount(),
  ]);

  const initialConfig = {
    siteName: config.siteName,
    watchFolders: config.watchFolders,
    defaultDestination: config.defaultDestination,
    recursive: config.recursive ?? false,
    excludedFolders: config.excludedFolders ?? [],
    adminUsername: session.username,
    processedFilesCount: processedCount,
    rules,
  };

  return <DashboardClient initialConfig={initialConfig} />;
}
