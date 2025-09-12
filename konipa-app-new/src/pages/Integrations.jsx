import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Database,
  Webhook,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  Plus,
  Eye,
  Activity,
  Clock,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  Bell
} from 'lucide-react';
import integrationService from '../services/integrationService';

const Integrations = () => {
  const [activeTab, setActiveTab] = useState('webhooks');

  // État pour les webhooks - rempli par les données du backend
  const [webhooks, setWebhooks] = useState([]);

  // Charger les webhooks depuis le backend
  useEffect(() => {
    const loadWebhooks = async () => {
      try {
        const webhooksData = await integrationService.getWebhooks();
        setWebhooks(webhooksData || []);
      } catch (error) {
        setWebhooks([]);
      }
    };
    
    loadWebhooks();
  }, []);

  // Simulation de test webhook
  const handleTestWebhook = async (webhook) => {
    // Simulation de test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (window.showToast) {
      window.showToast({
        type: 'success',
        title: 'Test webhook',
        message: `Webhook "${webhook.name}" testé avec succès`
      });
    }
  };

  const handleWebhookToggle = (webhookId) => {
    setWebhooks(prev => prev.map(webhook => 
      webhook.id === webhookId 
        ? { ...webhook, status: webhook.status === 'active' ? 'paused' : 'active' }
        : webhook
    ));
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Intégrations</h1>
        <p className="text-muted-foreground">Gérez vos webhooks et intégrations</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'webhooks', label: 'Webhooks', icon: Webhook },
              { id: 'monitoring', label: 'Monitoring', icon: Activity }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu des tabs */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >

        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            {/* Header webhooks */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Webhooks</h2>
                <p className="text-muted-foreground">Gérez vos endpoints de notification</p>
              </div>
              <button className="btn-konipa-primary flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Nouveau Webhook</span>
              </button>
            </div>

            {/* Liste des webhooks */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Webhooks Configurés</h3>
              </div>
              <div className="divide-y divide-border">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Webhook className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-foreground">{webhook.name}</h4>
                          <p className="text-sm text-muted-foreground">{webhook.url}</p>
                        </div>
                      </div>
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(webhook.status)}`}>
                        {getStatusIcon(webhook.status)}
                        <span className="capitalize">{webhook.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="text-sm text-muted-foreground mb-1">Événements</div>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-muted-foreground mb-1">Succès / Échecs</div>
                        <div className="text-lg font-semibold text-foreground">
                          {webhook.successCount} / {webhook.failureCount}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-muted-foreground mb-1">Dernier déclenchement</div>
                        <div className="text-sm text-foreground">
                          {formatDate(webhook.lastTriggered)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleWebhookToggle(webhook.id)}
                        className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          webhook.status === 'active'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {webhook.status === 'active' ? (
                          <>
                            <Pause className="w-4 h-4" />
                            <span>Suspendre</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span>Activer</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleTestWebhook(webhook)}
                        className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        <span>Tester</span>
                      </button>
                      <button className="flex items-center space-x-2 px-3 py-1 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">
                        <Eye className="w-4 h-4" />
                        <span>Logs</span>
                      </button>
                      <button className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                        <Trash2 className="w-4 h-4" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {/* Métriques globales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Webhooks Actifs</p>
                    <p className="text-3xl font-bold text-foreground">
                      {webhooks.filter(w => w.status === 'active').length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Webhook className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Événements/Jour</p>
                    <p className="text-3xl font-bold text-foreground">1,247</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taux de Succès</p>
                    <p className="text-3xl font-bold text-green-600">99.2%</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Temps Réponse</p>
                    <p className="text-3xl font-bold text-foreground">245ms</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Activité récente */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Activité Récente</h3>
              <div className="space-y-4">
                {[
                  { type: 'order.created', webhook: 'Sage Integration', status: 'success', time: '2 min' },
                  { type: 'inventory.stock_low', webhook: 'Alertes Stock', status: 'success', time: '5 min' },
                  { type: 'order.status_changed', webhook: 'Sage Integration', status: 'success', time: '8 min' },
                  { type: 'payment.received', webhook: 'Notifications Client', status: 'failed', time: '12 min' },
                  { type: 'customer.registered', webhook: 'Sage Integration', status: 'success', time: '15 min' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {activity.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{activity.type}</p>
                        <p className="text-sm text-muted-foreground">{activity.webhook}</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Il y a {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Integrations;

