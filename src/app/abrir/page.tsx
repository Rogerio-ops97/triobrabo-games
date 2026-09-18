import { notFound } from "next/navigation";
import { StoreLauncher } from "@/components/store-launcher";

const validSteamUrl = (value: string) => /^steam:\/\/store\/\d+$/.test(value);
const validFallback = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
};

export default async function OpenStorePage({ searchParams }: { searchParams: Promise<{ app?: string; fallback?: string }> }) {
  const { app = "", fallback = "" } = await searchParams;
  if (!validSteamUrl(app) || !validFallback(fallback)) notFound();
  return <StoreLauncher appUrl={app} fallbackUrl={fallback} />;
}
