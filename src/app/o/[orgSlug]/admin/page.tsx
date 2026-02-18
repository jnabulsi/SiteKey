import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ orgSlug: string }>;
};

export default async function AdminHomePage(props: Props) {
  const { orgSlug } = await props.params;
  redirect(`/o/${encodeURIComponent(orgSlug)}/admin/assets`);
}
