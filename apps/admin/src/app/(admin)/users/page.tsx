import { UsersDashboard } from "@/features/users/components/users-dashboard";
import { getUsersListData } from "@/features/users/list-queries";
import type { UsersSearchParams } from "@/features/users/list-types";

export const revalidate = 0;

interface UsersPageProps {
  searchParams: Promise<UsersSearchParams>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const data = await getUsersListData(await searchParams);
  return <UsersDashboard data={data} />;
}
