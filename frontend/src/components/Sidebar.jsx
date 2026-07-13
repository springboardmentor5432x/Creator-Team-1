import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-gray-900 text-white fixed left-0 top-0">

      <div className="text-3xl font-bold text-center py-6 border-b border-gray-700">
        CreatorIQ
      </div>

      <nav className="flex flex-col mt-5">

        <Link className="px-6 py-3 hover:bg-gray-700" to="/">
          Dashboard
        </Link>

        <Link className="px-6 py-3 hover:bg-gray-700" to="/analytics">
          Analytics
        </Link>

        <Link className="px-6 py-3 hover:bg-gray-700" to="/content">
          Content
        </Link>

        <Link className="px-6 py-3 hover:bg-gray-700" to="/revenue">
          Revenue
        </Link>

        <div className="px-6 mt-5 text-gray-400 text-sm">
          Platforms
        </div>

        <Link className="px-6 py-3 hover:bg-gray-700" to="/youtube">
          YouTube
        </Link>

        <Link className="px-6 py-3 hover:bg-gray-700" to="/instagram">
          Instagram
        </Link>

        <Link className="px-6 py-3 hover:bg-gray-700" to="/facebook">
          Facebook
        </Link>

        <Link className="px-6 py-3 hover:bg-gray-700" to="/linkedin">
          LinkedIn
        </Link>

        <Link className="px-6 py-3 hover:bg-gray-700" to="/x">
          X (Twitter)
        </Link>

        <div className="border-t border-gray-700 mt-5"></div>

        <Link className="px-6 py-3 hover:bg-gray-700" to="/profile">
          Profile
        </Link>

        <Link className="px-6 py-3 hover:bg-gray-700" to="/settings">
          Settings
        </Link>

        <Link className="px-6 py-3 text-red-400 hover:bg-red-600 hover:text-white" to="/login">
          Logout
        </Link>

      </nav>
    </div>
  );
}