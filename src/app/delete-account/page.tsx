import { publicPageMetadata } from "@/lib/seo";
import { DeleteAccountView } from "@/components/public/delete-account-view";

export const metadata = publicPageMetadata("/delete-account");

export default function Page() { return <DeleteAccountView />; }
