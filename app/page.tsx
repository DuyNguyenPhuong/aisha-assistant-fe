import Assistant from "../components/assistant";
import { unstable_noStore as noStore } from "next/cache";
import "./i18n";
export const dynamic = "force-dynamic";
export default async function Home() {
  noStore();
  return <Assistant />;
}
