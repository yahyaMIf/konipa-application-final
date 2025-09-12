import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import AlertBadge from '../alerts/AlertBadge';
import { 
  Home, 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Calculator, 
  Store, 
  CreditCard, 
  FileText, 
  Settings,
  User,
  LogOut,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';

const RoleBasedNavigation = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user, hasPermission, hasRole, logout } = useContext(AuthContext);

  if (!user) return null;

  // Define navigation items based on roles and permissions
  const getNavigationItems = () => {
    const items = [];

    // Dashboard - available to all authenticated users
    items.push({
      name: 'Tableau de bord',
      href: '/dashboard',
      icon: Home,
      show: true
    });

    // Alerts - available to staff roles
    if (hasRole('admin') || hasRole('accountant') || hasRole('commercial') || hasRole('counter') || hasRole('pos')) {
      items.push({
        name: 'Centre d\'Alertes',
        href: '/alerts',
        icon: AlertTriangle,
        show: true
      });
    }

    // Admin specific items
    if (hasRole('admin')) {
      items.push(
        {
          name: 'Gestion Utilisateurs',
          href: '/admin/users',
          icon: Users,
          show: hasPermission('manage_users')
        },
        {
          name: 'Administration',
          href: '/admin',
          icon: Settings,
          show: true
        }
      );
    }

    // Accountant specific items
    if (hasRole('accountant')) {
      items.push(
        {
          name: 'Comptabilité',
          href: '/accounting',
          icon: Calculator,
          show: hasPermission('view_finances')
        },
        {
          name: 'Rapports Financiers',
          href: '/accounting/reports',
          icon: FileText,
          show: hasPermission('view_reports')
        },
        {
          name: 'Gestion Impayés',
          href: '/accounting/unpaid',
          icon: CreditCard,
          show: hasPermission('manage_payments')
        }
      );
    }

    // Commercial specific items
    if (hasRole('commercial')) {
      items.push(
        {
          name: 'Commercial',
          href: '/commercial',
          icon: BarChart3,
          show: true
        },
        {
          name: 'Catalogue Produits',
          href: '/products',
          icon: Package,
          show: hasPermission('view_products')
        },
        {
          name: 'Commandes',
          href: '/orders',
          icon: ShoppingCart,
          show: hasPermission('view_orders')
        }
      );
    }

    // Counter staff specific items
    if (hasRole('counter')) {
      items.push(
        {
          name: 'Comptoir',
          href: '/counter',
          icon: Store,
          show: true
        },
        {
          name: 'Commandes',
          href: '/counter/orders',
          icon: ShoppingCart,
          show: hasPermission('manage_orders')
        },
        {
          name: 'Gestion Commandes',
          href: '/order-management',
          icon: ShoppingCart,
          show: true
        }
      );
    }

    // POS specific items
    if (hasRole('POS')) {
      items.push(
        {
          name: 'Point de Vente',
          href: '/pos',
          icon: CreditCard,
          show: true
        },
        {
          name: 'Caisse',
          href: '/pos/checkout',
          icon: Calculator,
          show: hasPermission('process_payments')
        }
      );
    }

    // Client specific items
    if (hasRole('client')) {
      items.push(
        {
          name: 'Mon Compte',
          href: '/client/dashboard',
          icon: User,
          show: true
        },
        {
          name: 'Mes Commandes',
          href: '/client/orders',
          icon: ShoppingCart,
          show: true
        },
        {
          name: 'Suivi Commandes',
          href: '/order-tracking',
          icon: Package,
          show: true
        },
        {
          name: 'Catalogue',
          href: '/catalog',
          icon: Package,
          show: true
        }
      );
    }

    // Common items for staff roles (excluding orders for admin, accountant)
    if (hasRole('admin') || hasRole('accountant') || hasRole('commercial')) {
      items.push(
        {
          name: 'Produits',
          href: '/products',
          icon: Package,
          show: hasPermission('view_products')
        }
      );
    }
    
    // Orders only for commercial role
    if (hasRole('commercial')) {
      items.push(
        {
          name: 'Commandes',
          href: '/orders',
          icon: ShoppingCart,
          show: hasPermission('view_orders')
        }
      );
    }

    return items.filter(item => item.show);
  };

  const navigationItems = getNavigationItems();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      // Force logout even if API call fails
      navigate('/login');
    }
  };

  return (
    <nav className={`bg-white shadow-lg ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">Konipa</h1>
            </div>
            
            {/* Navigation items */}
            <div className="hidden md:flex space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </a>
                );
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* Alert Badge */}
            <AlertBadge showCriticalOnly={true} />
            
            {/* User info */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
            </div>

            {/* Dropdown menu */}
            <div className="relative group">
              <button className="flex items-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {/* Dropdown content */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <a
                  href="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4 mr-3" />
                  Mon Profil
                </a>
                <a
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Paramètres
                </a>
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </a>
            );
          })}
          
          {/* Mobile user menu */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center px-3 py-2">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
            
            <a
              href="/profile"
              className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <User className="h-5 w-5 mr-3" />
              Mon Profil
            </a>
            
            <a
              href="/settings"
              className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Settings className="h-5 w-5 mr-3" />
              Paramètres
            </a>
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-700 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default RoleBasedNavigation;