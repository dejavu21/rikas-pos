'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ShoppingCart,
  Package,
  FolderTree,
  Users,
  Receipt,
  Wallet,
  RefreshCw,
  BarChart3,
  Settings,
  UsersRound,
  Database,
} from "lucide-react"
import { SignOutButton } from "@/components/auth/sign-out-button"

const navigation = [
  { name: 'Kasir / POS', href: '/pos', icon: ShoppingCart },
  { name: 'Produk', href: '/products', icon: Package },
  { name: 'Kategori', href: '/categories', icon: FolderTree },
  { name: 'Pelanggan', href: '/customers', icon: Users },
  { name: 'Transaksi', href: '/transactions', icon: Receipt },
  { name: 'Restok', href: '/restock', icon: RefreshCw },
  { name: 'Pengeluaran', href: '/expenses', icon: Wallet },
  { name: 'Laporan', href: '/reports', icon: BarChart3 },
  { name: 'Pegawai', href: '/users', icon: UsersRound },
  { name: 'Data', href: '/data', icon: Database },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: {
    name?: string | null
    email?: string | null
    role?: string | null
  }
}

export default function DashboardLayoutClient({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-30">
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-blue-600">KasirPOS</h1>
          <p className="text-xs text-slate-500 mt-1">Sistem Kasir Modern</p>
        </div>
        
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-140px)]">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {user?.role?.toLowerCase() || 'user'}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
