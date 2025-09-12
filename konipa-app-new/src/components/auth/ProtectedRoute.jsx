import React, { useContext, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { AlertCircle, Lock, User } from 'lucide-react';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredPermission = null, 
  requiredAnyRole = null,
  requiredAnyPermission = null,
  fallback = null 
}) => {
  const navigate = useNavigate();
  const { 
    user, 
    isAuthenticated, 
    loading, 
    hasRole, 
    hasPermission, 
    hasAnyRole, 
    hasAnyPermission 
  } = useContext(AuthContext);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated - redirect to login if not
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <User className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Rôle insuffisant
            </h2>
            <p className="text-gray-600 mb-2">
              Votre rôle actuel : <span className="font-medium text-gray-900">{user.role}</span>
            </p>
            <p className="text-gray-600 mb-6">
              Rôle requis : <span className="font-medium text-gray-900">{requiredRole}</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check any role requirements
  if (requiredAnyRole && !hasAnyRole(requiredAnyRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <User className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Rôle insuffisant
            </h2>
            <p className="text-gray-600 mb-2">
              Votre rôle actuel : <span className="font-medium text-gray-900">{user.role}</span>
            </p>
            <p className="text-gray-600 mb-6">
              Rôles autorisés : <span className="font-medium text-gray-900">{requiredAnyRole.join(', ')}</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check permission requirements
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Permission insuffisante
            </h2>
            <p className="text-gray-600 mb-2">
              Votre rôle : <span className="font-medium text-gray-900">{user.role}</span>
            </p>
            <p className="text-gray-600 mb-6">
              Permission requise : <span className="font-medium text-gray-900">{requiredPermission}</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check any permission requirements
  if (requiredAnyPermission && !hasAnyPermission(requiredAnyPermission)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Permission insuffisante
            </h2>
            <p className="text-gray-600 mb-2">
              Votre rôle : <span className="font-medium text-gray-900">{user.role}</span>
            </p>
            <p className="text-gray-600 mb-6">
              Permissions autorisées : <span className="font-medium text-gray-900">{requiredAnyPermission.join(', ')}</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed, render the protected content
  return children;
};

// Higher-order component for easier usage
export const withAuth = (Component, options = {}) => {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Specific role-based components
export const AdminRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredRole="admin" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const CEORoute = ({ children, fallback }) => (
  <ProtectedRoute requiredRole="admin" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const AccountantRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredRole="accountant" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const CommercialRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredRole="commercial" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const CounterRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredRole="counter" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const POSRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredRole="POS" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const ClientRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredRole="client" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

// Permission-based components
export const ManageUsersRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredPermission="manage_users" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const ManageProductsRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredPermission="manage_products" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const ViewReportsRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredPermission="view_reports" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const ManageOrdersRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredPermission="manage_orders" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const ViewFinancesRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredPermission="view_finances" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

// Multi-role components
export const StaffRoute = ({ children, fallback }) => (
  <ProtectedRoute 
    requiredAnyRole={['admin', 'accountant', 'commercial', 'counter', 'POS']} 
    fallback={fallback}
  >
    {children}
  </ProtectedRoute>
);

export const ManagementRoute = ({ children, fallback }) => (
  <ProtectedRoute 
    requiredAnyRole={['admin', 'accountant']} 
    fallback={fallback}
  >
    {children}
  </ProtectedRoute>
);

export const SalesRoute = ({ children, fallback }) => (
  <ProtectedRoute 
    requiredAnyRole={['commercial', 'counter', 'POS']} 
    fallback={fallback}
  >
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;