import { publicPageMetadata } from "@/lib/seo";
import { AboutView } from "@/components/public/about-view";

export const metadata = publicPageMetadata("/about");

export default function Page() { return <AboutView />; }
