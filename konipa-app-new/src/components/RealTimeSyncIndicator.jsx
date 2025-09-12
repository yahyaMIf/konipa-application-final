import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const RealTimeSyncIndicator = ({ 
  isConnected, 
  lastSyncTime, 
  syncStatus, 
  onReconnect,
  className = '' 
}) => {
  const getStatusColor = () => {
    if (!isConnected) return 'text-red-600';
    if (syncStatus === 'syncing') return 'text-yellow-600';
    if (syncStatus === 'error') return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (!isConnected) return WifiOff;
    if (syncStatus === 'syncing') return RefreshCw;
    if (syncStatus === 'error') return AlertCircle;
    return Wifi;
  };

  const getStatusText = () => {
    if (!isConnected) return 'Hors ligne';
    if (syncStatus === 'syncing') return 'Synchronisation...';
    if (syncStatus === 'error') return 'Erreur sync';
    return 'Temps réel';
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return '';
    const now = new Date();
    const diff = Math.floor((now - lastSyncTime) / 1000);
    
    if (diff < 60) return `il y a ${diff}s`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    return `il y a ${Math.floor(diff / 3600)}h`;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        <StatusIcon 
          className={`h-4 w-4 ${
            syncStatus === 'syncing' ? 'animate-spin' : ''
          }`} 
        />
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>
      
      {lastSyncTime && isConnected && (
        <span className="text-xs text-gray-500">
          {formatLastSync()}
        </span>
      )}
      
      {!isConnected && onReconnect && (
        <button
          onClick={onReconnect}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
          title="Reconnecter"
        >
          Reconnecter
        </button>
      )}
    </div>
  );
};

export default RealTimeSyncIndicator;