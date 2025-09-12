import React from 'react';
import { AlertTriangle, Bell, Shield, Server, TrendingUp, Package, DollarSign, Users, Settings, Activity } from 'lucide-react';
import { useAlertNotifications } from '../../hooks/useRealTimeAlerts';

/**
 * Composant de badge d'alerte avec icône et compteur
 * Affiche le nombre d'alertes actives avec une animation pour les nouvelles alertes
 */
const AlertBadge = ({ 
  onClick, 
  className = '', 
  showCriticalOnly = false,
  size = 'medium',
  variant = 'default'
}) => {
  const { alertCount, criticalCount, hasNewAlert, markAsViewed } = useAlertNotifications();
  
  const displayCount = showCriticalOnly ? criticalCount : alertCount;
  const hasAlerts = displayCount > 0;
  
  const handleClick = () => {
    markAsViewed();
    if (onClick) onClick();
  };
  
  // Styles selon la taille
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10'
  };
  
  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24
  };
  
  const badgeSizes = {
    small: 'text-xs min-w-[16px] h-4',
    medium: 'text-xs min-w-[18px] h-5',
    large: 'text-sm min-w-[20px] h-6'
  };
  
  // Styles selon la variante
  const variantClasses = {
    default: hasAlerts 
      ? (criticalCount > 0 ? 'text-red-600 hover:text-red-700' : 'text-orange-600 hover:text-orange-700')
      : 'text-gray-400 hover:text-gray-600',
    minimal: hasAlerts 
      ? (criticalCount > 0 ? 'text-red-500' : 'text-orange-500')
      : 'text-gray-400',
    filled: hasAlerts 
      ? (criticalCount > 0 ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200')
      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
  };
  
  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`
          relative flex items-center justify-center rounded-full transition-all duration-200
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${variant === 'filled' ? 'p-1' : ''}
          ${hasNewAlert ? 'animate-pulse' : ''}
          ${className}
        `}
        title={`${displayCount} alerte${displayCount > 1 ? 's' : ''} active${displayCount > 1 ? 's' : ''}`}
      >
        {/* Icône principale */}
        {showCriticalOnly ? (
          <AlertTriangle size={iconSizes[size]} />
        ) : (
          <Bell size={iconSizes[size]} />
        )}
        
        {/* Badge de compteur */}
        {hasAlerts && (
          <span className={`
            absolute -top-1 -right-1 flex items-center justify-center
            rounded-full font-bold leading-none
            ${badgeSizes[size]}
            ${criticalCount > 0 
              ? 'bg-red-500 text-white' 
              : 'bg-orange-500 text-white'
            }
            ${hasNewAlert ? 'animate-bounce' : ''}
          `}>
            {displayCount > 99 ? '99+' : displayCount}
          </span>
        )}
        
        {/* Indicateur de nouvelle alerte */}
        {hasNewAlert && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        )}
      </button>
    </div>
  );
};

/**
 * Composant d'icône d'alerte par type
 * Affiche l'icône appropriée selon le type d'alerte
 */
export const AlertTypeIcon = ({ type, size = 20, className = '' }) => {
  const iconProps = { size, className };
  
  const icons = {
    SECURITY: <Shield {...iconProps} className={`text-red-600 ${className}`} />,
    SYSTEM: <Server {...iconProps} className={`text-blue-600 ${className}`} />,
    BUSINESS: <TrendingUp {...iconProps} className={`text-green-600 ${className}`} />,
    INVENTORY: <Package {...iconProps} className={`text-purple-600 ${className}`} />,
    FINANCIAL: <DollarSign {...iconProps} className={`text-yellow-600 ${className}`} />,
    CUSTOMER: <Users {...iconProps} className={`text-indigo-600 ${className}`} />,
    OPERATIONAL: <Settings {...iconProps} className={`text-gray-600 ${className}`} />,
    PERFORMANCE: <Activity {...iconProps} className={`text-orange-600 ${className}`} />
  };
  
  return icons[type] || <AlertTriangle {...iconProps} className={`text-gray-600 ${className}`} />;
};

/**
 * Composant de badge de priorité
 * Affiche un badge coloré selon la priorité de l'alerte
 */
export const PriorityBadge = ({ priority, size = 'small', className = '' }) => {
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-2 text-base'
  };
  
  const priorityClasses = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200'
  };
  
  const priorityLabels = {
    critical: 'Critique',
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible'
  };
  
  return (
    <span className={`
      inline-flex items-center rounded-full border font-medium
      ${sizeClasses[size]}
      ${priorityClasses[priority] || priorityClasses.medium}
      ${className}
    `}>
      {priorityLabels[priority] || priority}
    </span>
  );
};

/**
 * Composant de badge de statut
 * Affiche le statut actuel de l'alerte
 */
export const StatusBadge = ({ status, size = 'small', className = '' }) => {
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-2 text-base'
  };
  
  const statusClasses = {
    active: 'bg-red-100 text-red-800 border-red-200',
    acknowledged: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    escalated: 'bg-purple-100 text-purple-800 border-purple-200'
  };
  
  const statusLabels = {
    active: 'Active',
    acknowledged: 'Acquittée',
    resolved: 'Résolue',
    escalated: 'Escaladée'
  };
  
  return (
    <span className={`
      inline-flex items-center rounded-full border font-medium
      ${sizeClasses[size]}
      ${statusClasses[status] || statusClasses.active}
      ${className}
    `}>
      {statusLabels[status] || status}
    </span>
  );
};

/**
 * Composant de mini-dashboard d'alertes
 * Affiche un résumé compact des alertes pour les barres latérales
 */
export const AlertMiniDashboard = ({ className = '' }) => {
  const { alertCount, criticalCount, stats } = useAlertNotifications();
  
  if (alertCount === 0) {
    return (
      <div className={`p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-700 font-medium">Aucune alerte active</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`p-3 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="space-y-2">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Alertes Actives</span>
          <span className="text-lg font-bold text-gray-900">{alertCount}</span>
        </div>
        
        {/* Alertes critiques */}
        {criticalCount > 0 && (
          <div className="flex items-center justify-between p-2 bg-red-50 rounded">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm text-red-700">Critiques</span>
            </div>
            <span className="text-sm font-bold text-red-700">{criticalCount}</span>
          </div>
        )}
        
        {/* Répartition par priorité */}
        <div className="space-y-1">
          {stats.byPriority?.high > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-orange-600">Élevée</span>
              <span className="font-medium">{stats.byPriority.high}</span>
            </div>
          )}
          {stats.byPriority?.medium > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-yellow-600">Moyenne</span>
              <span className="font-medium">{stats.byPriority.medium}</span>
            </div>
          )}
          {stats.byPriority?.low > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-600">Faible</span>
              <span className="font-medium">{stats.byPriority.low}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertBadge;