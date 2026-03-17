import Sidebar from "@/components/Sidebar";

export default function ProtectedLayout({ children }) {
  return <Sidebar>{children}</Sidebar>;
}
