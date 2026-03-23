import Sidebar from "@/components/Sidebar";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export default async function ProtectedLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let user = null;

  if (token) {
    user = verifyToken(token);
  }

  return <Sidebar user={user}>{children}</Sidebar>;
}
