import type { Metadata } from "next";
import { DeleteAccountView } from "@/components/public/delete-account-view";

export const metadata: Metadata = {
  title: "账号与数据删除申请",
  description: "通过邮件申请删除日语造句实验室或旧功过格账号与关联数据，了解申请范围和记录保留说明。",
  alternates: { canonical: "/delete-account" },
};

export default function Page() {
  return <DeleteAccountView />;
}
