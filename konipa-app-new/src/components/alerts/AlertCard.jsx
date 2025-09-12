import React, { useState } from 'react';
import { 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  MoreVertical,
  ExternalLink,
  MessageSquare,
  ArrowUp,
  Calendar
} from 'lucide-react';
import { AlertTypeIcon, PriorityBadge, StatusBadge } from './AlertBadge';
import { useRealTimeAlerts } from '../../hooks/useRealTimeAlerts';

/**
 * Composant de carte d'alerte
 * Affiche les détails d'une alerte avec les actions possibles
 */
const AlertCard = ({ 
  alert, 
  onAcknowledge, 
  onResolve, 
  onEscalate,
  onViewDetails,
  compact = false,
  showActions = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionReason, setResolutionReason] = useState('');
  
  const { acknowledgeAlert, resolveAlert } = useRealTimeAlerts();
  
  // Formatage de la date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };
  
  // Calcul du temps écoulé
  const getTimeAgo = (date) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffMs = now - alertDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };
  
  // Gestion de l'acquittement
  const handleAcknowledge = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const success = await acknowledgeAlert(alert.id);
      if (success && onAcknowledge) {
        onAcknowledge(alert);
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };
  
  // Gestion de la résolution
  const handleResolve = async () => {
    if (isLoading || !resolutionReason.trim()) return;
    
    setIsLoading(true);
    try {
      const success = await resolveAlert(alert.id, resolutionReason);
      if (success) {
        setShowResolutionForm(false);
        setResolutionReason('');
        if (onResolve) {
          onResolve(alert);
        }
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };
  
  // Gestion de l'escalade
  const handleEscalate = () => {
    if (onEscalate) {
      onEscalate(alert);
    }
  };
  
  // Classes CSS selon la priorité
  const priorityClasses = {
    critical: 'border-l-red-500 bg-red-50',
    high: 'border-l-orange-500 bg-orange-50',
    medium: 'border-l-yellow-500 bg-yellow-50',
    low: 'border-l-blue-500 bg-blue-50'
  };
  
  const cardClasses = `
    border-l-4 bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200
    ${priorityClasses[alert.priority] || priorityClasses.medium}
    ${compact ? 'p-3' : 'p-4'}
    ${className}
  `;
  
  if (compact) {
    return (
      <div className={cardClasses}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <AlertTypeIcon type={alert.type} size={20} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {alert.title}
              </h4>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {alert.message}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <PriorityBadge priority={alert.priority} size="small" />
                <span className="text-xs text-gray-500">
                  {getTimeAgo(alert.timestamp)}
                </span>
              </div>
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-1 ml-2">
              {!alert.acknowledged && (
                <button
                  onClick={handleAcknowledge}
                  disabled={isLoading}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Acquitter"
                >
                  <Eye size={16} />
                </button>
              )}
              {alert.status === 'active' && (
                <button
                  onClick={() => setShowResolutionForm(true)}
                  disabled={isLoading}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                  title="Résoudre"
                >
                  <CheckCircle size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={cardClasses}>
      {/* En-tête de la carte */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <AlertTypeIcon type={alert.type} size={24} />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {alert.title}
              </h3>
              <PriorityBadge priority={alert.priority} />
              <StatusBadge status={alert.status} />
            </div>
            <p className="text-gray-700 mb-2">
              {alert.message}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? 'Réduire' : 'Développer'}
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>
      
      {/* Métadonnées */}
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
        <div className="flex items-center space-x-1">
          <Clock size={16} />
          <span>{formatDate(alert.timestamp)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar size={16} />
          <span>{getTimeAgo(alert.timestamp)}</span>
        </div>
        {alert.source && (
          <div className="flex items-center space-x-1">
            <ExternalLink size={16} />
            <span>{alert.source}</span>
          </div>
        )}
      </div>
      
      {/* Détails étendus */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
          {/* Données supplémentaires */}
          {alert.data && Object.keys(alert.data).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Détails techniques</h4>
              <div className="bg-gray-50 rounded p-3">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(alert.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          {/* Actions automatiques */}
          {alert.actions && alert.actions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Actions automatiques</h4>
              <ul className="space-y-1">
                {alert.actions.map((action, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>{action.description}</span>
                    {action.status && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        action.status === 'completed' ? 'bg-green-100 text-green-700' :
                        action.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {action.status}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Historique */}
          {alert.history && alert.history.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Historique</h4>
              <div className="space-y-2">
                {alert.history.map((event, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{event.action}</span>
                        <span className="text-gray-500">{formatDate(event.timestamp)}</span>
                      </div>
                      {event.user && (
                        <div className="flex items-center space-x-1 text-gray-600">
                          <User size={12} />
                          <span>{event.user}</span>
                        </div>
                      )}
                      {event.details && (
                        <p className="text-gray-600 mt-1">{event.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {!alert.acknowledged && (
              <button
                onClick={handleAcknowledge}
                disabled={isLoading}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                <Eye size={16} />
                <span>Acquitter</span>
              </button>
            )}
            
            {alert.status === 'active' && (
              <button
                onClick={() => setShowResolutionForm(true)}
                disabled={isLoading}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
              >
                <CheckCircle size={16} />
                <span>Résoudre</span>
              </button>
            )}
            
            {alert.priority !== 'critical' && alert.status === 'active' && (
              <button
                onClick={handleEscalate}
                disabled={isLoading}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors disabled:opacity-50"
              >
                <ArrowUp size={16} />
                <span>Escalader</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(alert)}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ExternalLink size={16} />
                <span>Détails</span>
              </button>
            )}
            
            <button
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              title="Ajouter un commentaire"
            >
              <MessageSquare size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Formulaire de résolution */}
      {showResolutionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Résoudre l'alerte
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de la résolution
                </label>
                <textarea
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Décrivez comment l'alerte a été résolue..."
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowResolutionForm(false);
                    setResolutionReason('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleResolve}
                  disabled={isLoading || !resolutionReason.trim()}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Résolution...' : 'Résoudre'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertCard;