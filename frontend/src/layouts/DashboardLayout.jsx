import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 w-full p-8 bg-gray-100 min-h-screen">
        {children}
      </div>
    </div>
  );
}