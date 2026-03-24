import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutGrid,
  Home,
  Heart,
  Users,
  UserCheck,
  ShoppingBag,
  Plus,
  Menu,
  X,
  LogOut,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { name: "Feed", page: "Feed", icon: LayoutGrid },
  { name: "My Listings", page: "MyListings", icon: Home },
  { name: "Favorites", page: "Favorites", icon: Heart },
  { name: "Buyers", page: "Buyers", icon: ShoppingBag },
  { name: "Sellers", page: "Sellers", icon: UserCheck },
  { name: "Agents", page: "Agents", icon: Users },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <style>{`
        :root {
          --sidebar-bg: #0f172a;
          --sidebar-hover: #1e293b;
          --accent: #0d9488;
          --accent-light: #ccfbf1;
        }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-white flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link to={createPageUrl("Feed")} onClick={() => setSidebarOpen(false)}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">ProMemo</h1>
                <p className="text-[11px] text-gray-400 -mt-0.5">Nha Trang Real Estate</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-teal-500/20 text-teal-300"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? "text-teal-400" : ""}`} />
                {item.name}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-teal-400" />}
              </Link>
            );
          })}
        </nav>

        {/* New Listing CTA */}
        <div className="p-4 border-t border-white/10">
          <Link to={createPageUrl("CreateListing")} onClick={() => setSidebarOpen(false)}>
            <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white gap-2">
              <Plus className="w-4 h-4" />
              New Listing
            </Button>
          </Link>
        </div>

        {/* User */}
        {user && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold">
                {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.full_name || "Agent"}</p>
                <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => base44.auth.logout()}
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">ProMemo</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}