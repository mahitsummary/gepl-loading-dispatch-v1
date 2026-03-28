'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ChevronDown,
  LayoutDashboard,
  Package,
  TrendingUp,
  Truck,
  FileText,
  Settings,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';

const menuItems = {
  dashboard: {
    label: 'DASHBOARD',
    icon: LayoutDashboard,
    items: [{ label: 'Dashboard', href: '/' }],
  },
  masters: {
    label: 'MASTERS',
    icon: Package,
    items: [
      { label: 'Item Master', href: '/masters/items' },
      { label: 'Vendor Master', href: '/masters/vendors' },
      { label: 'Warehouse Master', href: '/masters/warehouses' },
      { label: 'Production Plants', href: '/masters/plants' },
      { label: 'Supervisor Master', href: '/masters/supervisors' },
      { label: 'Driver Master', href: '/masters/drivers' },
      { label: 'Vehicle Master', href: '/masters/vehicles' },
      { label: 'Batch Master', href: '/masters/batches' },
    ],
  },
  gatepass: {
    label: 'SECURITY',
    icon: ShieldCheck,
    items: [{ label: 'Gate Pass', href: '/gate-pass' }],
  },
  inward: {
    label: 'INWARD',
    icon: TrendingUp,
    items: [{ label: 'Inward from Purchase (GRN)', href: '/inward/grn' }],
  },
  movement: {
    label: 'MATERIAL MOVEMENT',
    icon: Truck,
    items: [
      { label: 'Material Requisition', href: '/movement/requisition' },
      { label: 'Internal Dispatch', href: '/movement/dispatch' },
      { label: 'Internal Receipt', href: '/movement/receipt' },
    ],
  },
  reconciliation: {
    label: 'RECONCILIATION',
    icon: FileText,
    items: [
      { label: 'Dispatch vs Receipt Reco', href: '/reconciliation/dispatch-receipt' },
      { label: 'Production Reco', href: '/reconciliation/production' },
    ],
  },
  production: {
    label: 'PRODUCTION',
    icon: Package,
    items: [
      { label: 'Issue to Production', href: '/production/issue' },
      { label: 'Production Output', href: '/production/output' },
      { label: 'RM Return to Stores', href: '/production/return' },
    ],
  },
  stock: {
    label: 'STOCK',
    icon: Package,
    items: [
      { label: 'Stock Overview', href: '/stock/overview' },
      { label: 'Goods in Transit', href: '/stock/in-transit' },
      { label: 'FG Stock', href: '/stock/fg' },
      { label: 'Rejected Stock', href: '/stock/rejected' },
    ],
  },
  reports: {
    label: 'REPORTS',
    icon: FileText,
    items: [{ label: 'Supervisor Scorecard', href: '/reports/scorecard' }],
  },
  settings: {
    label: 'SETTINGS',
    icon: Settings,
    items: [{ label: 'Add Masters', href: '/settings/add-masters' }],
  },
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState({
    dashboard: true,
    masters: false,
    gatepass: false,
    inward: false,
    movement: false,
    reconciliation: false,
    production: false,
    stock: false,
    reports: false,
    settings: false,
  });

  const toggleMenu = (menuKey) => {
    setExpandedMenus({
      ...expandedMenus,
      [menuKey]: !expandedMenus[menuKey],
    });
  };

  const isActive = (href) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-secondary-900 text-white z-30 transform transition-transform duration-300 lg:translate-x-0 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center px-6 border-b border-secondary-800 bg-primary-600">
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-primary-600">
              G
            </div>
            <div>
              <h1 className="font-bold text-lg">GEPL</h1>
              <p className="text-xs text-secondary-300">v1.0</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="py-4">
          {Object.entries(menuItems).map(([menuKey, menu]) => {
            const Icon = menu.icon;
            const isExpanded = expandedMenus[menuKey];

            return (
              <div key={menuKey} className="mb-2">
                <button
                  onClick={() => toggleMenu(menuKey)}
                  className="w-full flex items-center gap-3 px-6 py-3 hover:bg-secondary-800 transition-colors"
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium flex-1 text-left">
                    {menu.label}
                  </span>
                  {menu.items.length > 0 && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Submenu items */}
                {isExpanded && (
                  <div className="bg-secondary-800/50">
                    {menu.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`block px-6 py-2 pl-12 text-sm transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary-600 text-white'
                            : 'text-secondary-300 hover:text-white hover:bg-secondary-700'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-secondary-800 bg-secondary-800 p-4 text-xs text-secondary-400">
          <p>© 2025 GEPL System</p>
          <p>v1.0 - Material Tracking</p>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 lg:hidden z-50 bg-primary-600 text-white p-3 rounded-full shadow-lg"
      >
        <Menu size={24} />
      </button>
    </>
  );
};

export default Sidebar;
