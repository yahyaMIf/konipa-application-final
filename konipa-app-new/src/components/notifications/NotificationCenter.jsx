import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import useNotifications from '../../hooks/useNotifications';

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,
    connectionError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    requestNotificationPermission
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const open = Boolean(anchorEl);

  // Vérifier les permissions de notification au montage
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setShowSettings(false);
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
  };

  const getNotificationIcon = (type, priority) => {
    const iconProps = { fontSize: 'small' };
    
    switch (type) {
      case 'success':
        return <CheckCircleIcon {...iconProps} color="success" />;
      case 'warning':
        return <WarningIcon {...iconProps} color="warning" />;
      case 'error':
        return <ErrorIcon {...iconProps} color="error" />;
      case 'info':
      default:
        return <InfoIcon {...iconProps} color="info" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'default';
    }
  };

  const formatNotificationTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: fr
      });
    } catch (error) {
      return 'Il y a un moment';
    }
  };

  const renderConnectionStatus = () => {
    if (connectionError) {
      return (
        <Alert severity="error" sx={{ m: 1, fontSize: '0.875rem' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <WifiOffIcon fontSize="small" />
            {connectionError}
          </Box>
        </Alert>
      );
    }

    if (!isConnected) {
      return (
        <Alert severity="warning" sx={{ m: 1, fontSize: '0.875rem' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <WifiOffIcon fontSize="small" />
            Mode hors ligne - Notifications limitées
          </Box>
        </Alert>
      );
    }

    return (
      <Alert severity="success" sx={{ m: 1, fontSize: '0.875rem' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WifiIcon fontSize="small" />
          Notifications en temps réel activées
        </Box>
      </Alert>
    );
  };

  const renderNotificationSettings = () => {
    if (!showSettings) return null;

    return (
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" gutterBottom>
          Paramètres des notifications
        </Typography>
        
        {notificationPermission === 'default' && (
          <Button
            size="small"
            variant="outlined"
            onClick={handleRequestPermission}
            fullWidth
            sx={{ mb: 1 }}
          >
            Autoriser les notifications du navigateur
          </Button>
        )}
        
        {notificationPermission === 'denied' && (
          <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
            Les notifications du navigateur sont désactivées. 
            Vous pouvez les réactiver dans les paramètres de votre navigateur.
          </Alert>
        )}
        
        {notificationPermission === 'granted' && (
          <Alert severity="success" sx={{ fontSize: '0.75rem' }}>
            Les notifications du navigateur sont activées.
          </Alert>
        )}
      </Box>
    );
  };

  const renderNotificationList = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 1 }}>
          {error}
        </Alert>
      );
    }

    if (notifications.length === 0) {
      return (
        <Box p={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Aucune notification
          </Typography>
        </Box>
      );
    }

    return (
      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {notifications.slice(0, 10).map((notification, index) => (
          <React.Fragment key={notification.id}>
            <ListItem
              sx={{
                backgroundColor: notification.read ? 'transparent' : 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.selected'
                }
              }}
            >
              <ListItemIcon>
                {getNotificationIcon(notification.type, notification.priority)}
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                      {notification.title}
                    </Typography>
                    {notification.priority && (
                      <Chip
                        label={notification.priority}
                        size="small"
                        color={getPriorityColor(notification.priority)}
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatNotificationTime(notification.created_at || notification.timestamp)}
                    </Typography>
                  </Box>
                }
              />
              
              <Box display="flex" flexDirection="column" gap={0.5}>
                {!notification.read && (
                  <Tooltip title="Marquer comme lu">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                    >
                      <MarkEmailReadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title="Supprimer">
                  <IconButton
                    size="small"
                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItem>
            
            {index < notifications.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <>
      <Tooltip title={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}>
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxWidth: '90vw'
          }
        }}
      >
        <Box>
          {/* En-tête */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p={2}
            borderBottom={1}
            borderColor="divider"
          >
            <Typography variant="h6">
              Notifications ({unreadCount})
            </Typography>
            
            <Box display="flex" gap={1}>
              <Tooltip title="Actualiser">
                <IconButton size="small" onClick={refreshNotifications}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Paramètres">
                <IconButton
                  size="small"
                  onClick={() => setShowSettings(!showSettings)}
                  color={showSettings ? 'primary' : 'default'}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              {unreadCount > 0 && (
                <Tooltip title="Tout marquer comme lu">
                  <IconButton size="small" onClick={handleMarkAllAsRead}>
                    <MarkEmailReadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Statut de connexion */}
          {renderConnectionStatus()}

          {/* Paramètres */}
          {renderNotificationSettings()}

          {/* Liste des notifications */}
          {renderNotificationList()}

          {/* Pied de page */}
          {notifications.length > 10 && (
            <Box p={2} borderTop={1} borderColor="divider" textAlign="center">
              <Typography variant="caption" color="text.secondary">
                Affichage des 10 dernières notifications
              </Typography>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationCenter;