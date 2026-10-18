import { publicPageMetadata } from "@/lib/seo";
import { PrivacyView } from "@/components/public/privacy-view";

export const metadata = publicPageMetadata("/privacy");

export default function Page() { return <PrivacyView />; }
