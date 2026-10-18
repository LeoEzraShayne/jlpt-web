import { publicPageMetadata } from "@/lib/seo";
import { HomeView } from "@/components/public/home-view";

export const metadata = publicPageMetadata("/");

export default function Page() { return <HomeView />; }
