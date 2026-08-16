import { notFound } from "next/navigation";
import { UserDetail } from "@/features/users/components/user-detail";
import { getUserDetail, parseUserId } from "@/features/users/detail-queries";

export const revalidate = 0;

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId: rawUserId } = await params;
  const userId = parseUserId(rawUserId);

  if (userId === null) notFound();

  const detail = await getUserDetail(userId);
  if (!detail) notFound();

  return <UserDetail detail={detail} />;
}
