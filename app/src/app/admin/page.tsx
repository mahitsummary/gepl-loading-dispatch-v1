'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Package,
  Users,
  Store,
  Building2,
  Warehouse,
  Truck,
  Shield,
  UserCheck,
  AlertCircle,
  Loader,
  Layers,
} from 'lucide-react';

interface AdminCard {
  icon: React.ReactNode;
  title: string;
  href: string;
  count: number;
  color: string;
  countLabel: string;
}

export default function AdminPage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({
    items: 0,
    vendors: 0,
    customers: 0,
    warehouses: 0,
    plants: 0,
    vehicles: 0,
    supervisors: 0,
    drivers: 0,
    boms: 0,
  });

  useEffect(() => {
    const checkAccess = async () => {
      if (!hasPermission('admin')) {
        router.push('/dashboard');
        return;
      }

      try {
        // Fetch counts from all tables
        const [
          itemsRes,
          vendorsRes,
          customersRes,
          warehousesRes,
          plantsRes,
          vehiclesRes,
          supervisorsRes,
          driversRes,
          bomsRes,
        ] = await Promise.all([
          supabase.from('items').select('*', { count: 'exact', head: true }),
          supabase.from('vendors').select('*', { count: 'exact', head: true }),
          supabase.from('customers').select('*', { count: 'exact', head: true }),
          supabase.from('warehouses').select('*', { count: 'exact', head: true }),
          supabase.from('plants').select('*', { count: 'exact', head: true }),
          supabase.from('vehicles').select('*', { count: 'exact', head: true }),
          supabase
            .from('supervisors')
            .select('*', { count: 'exact', head: true }),
          supabase.from('drivers').select('*', { count: 'exact', head: true }),
          supabase.from('boms').select('*', { count: 'exact', head: true }),
        ]);

        setCounts({
          items: itemsRes.count || 0,
          vendors: vendorsRes.count || 0,
          customers: customersRes.count || 0,
          warehouses: warehousesRes.count || 0,
          plants: plantsRes.count || 0,
          vehicles: vehiclesRes.count || 0,
          supervisors: supervisorsRes.count || 0,
          drivers: driversRes.count || 0,
          boms: bomsRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [hasPermission, router]);

  const adminCards: AdminCard[] = [
    {
      icon: <Package className="w-8 h-8" />,
      title: 'Item Master',
      href: '/admin/items',
      count: counts.items,
      color: 'from-blue-500 to-blue-600',
      countLabel: 'Items',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Vendor Master',
      href: '/admin/vendors',
      count: counts.vendors,
      color: 'from-purple-500 to-purple-600',
      countLabel: 'Vendors',
    },
    {
      icon: <Store className="w-8 h-8" />,
      title: 'Customer Master',
      href: '/admin/customers',
      count: counts.customers,
      color: 'from-green-500 to-green-600',
      countLabel: 'Customers',
    },
    {
      icon: <Warehouse className="w-8 h-8" />,
      title: 'Warehouse Master',
      href: '/admin/warehouses',
      count: counts.warehouses,
      color: 'from-orange-500 to-orange-600',
      countLabel: 'Warehouses',
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      title: 'Plant Master',
      href: '/admin/plants',
      count: counts.plants,
      color: 'from-red-500 to-red-600',
      countLabel: 'Plants',
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'Vehicle Master',
      href: '/admin/vehicles',
      count: counts.vehicles,
      color: 'from-yellow-500 to-yellow-600',
      countLabel: 'Vehicles',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Supervisor Master',
      href: '/admin/supervisors',
      count: counts.supervisors,
      color: 'from-indigo-500 to-indigo-600',
      countLabel: 'Supervisors',
    },
    {
      icon: <UserCheck className="w-8 h-8" />,
      title: 'Driver Master',
      href: '/admin/drivers',
      count: counts.drivers,
      color: 'from-pink-500 to-pink-600',
      countLabel: 'Drivers',
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: 'BOM Management',
      href: '/admin/bom',
      count: counts.boms,
      color: 'from-teal-500 to-teal-600',
      countLabel: 'BOMs',
    },
  ];

  if (!hasPermission('admin')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
          <p className="text-lg text-gray-700">
            You do not have permission to access the admin panel.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-4xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">
            Manage masters and configuration data
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminCards.map((card) => (
              <Link key={card.href} href={card.href}>
                <div className="h-full bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer overflow-hidden group">
                  {/* Gradient Header */}
                  <div
                    className={`bg-gradient-to-r ${card.color} p-6 text-white flex items-center justify-between`}
                  >
                    <div className="text-3xl font-bold">{card.count}</div>
                    <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                      {card.icon}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600">{card.countLabel}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
