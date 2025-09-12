import apiService from './apiService';
import databaseService from './databaseService';

class StatusVerificationService {
  constructor() {
    this.verificationInterval = null;
    this.isRunning = false;
    this.currentUser = null;
    this.onStatusChange = null;
    this.verificationFrequency = 30000; // 30 seconds
    this.statusChangeHandler = null;
  }

  /**
   * Start real-time status verification for the current user
   * @param {Object} user - Current authenticated user
   * @param {Function} onStatusChange - Callback for status changes
   */
  start(user, onStatusChange) {
    if (this.isRunning) {
      this.stop();
    }

    this.currentUser = user;
    this.onStatusChange = onStatusChange;
    this.statusChangeHandler = onStatusChange;
    this.isRunning = true;

    // Initial verification
    this.verifyUserStatus();

    // Set up periodic verification
    this.verificationInterval = setInterval(() => {
      this.verifyUserStatus();
    }, this.verificationFrequency);

  }

  /**
   * Stop the status verification service
   */
  stop() {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
    }
    
    this.isRunning = false;
    this.currentUser = null;
    this.onStatusChange = null;

  }

  /**
   * Verify the current user's status
   */
  async verifyUserStatus() {
    if (!this.currentUser || !this.isRunning) {
      return;
    }

    try {
      // Check user status in the system
      const currentUserData = await this.getCurrentUserData();
      
      if (!currentUserData) {
        // User no longer exists
        this.handleStatusChange({
          type: 'user_deleted',
          message: 'Votre compte a été supprimé',
          severity: 'error',
          action: 'logout'
        });
        return;
      }

      // Check if user is still active
      if (!currentUserData.user?.isActive) {
        this.handleStatusChange({
          type: 'account_deactivated',
          message: 'Votre compte a été désactivé',
          severity: 'error',
          action: 'logout'
        });
        return;
      }

      // Check for role changes
      if (currentUserData.user?.role !== this.currentUser.role) {
        this.handleStatusChange({
          type: 'role_changed',
          message: `Votre rôle a été modifié de ${this.currentUser.role} à ${currentUserData.user.role}`,
          severity: 'warning',
          action: 'reload',
          newUserData: currentUserData.user
        });
        return;
      }

      // Check for permission changes
      const currentPermissions = currentUserData.user?.permissions || [];
      const userPermissions = this.currentUser.permissions || [];
      
      if (JSON.stringify(currentPermissions.sort()) !== JSON.stringify(userPermissions.sort())) {
        this.handleStatusChange({
          type: 'permissions_changed',
          message: 'Vos permissions ont été modifiées',
          severity: 'info',
          action: 'reload',
          newUserData: currentUserData.user
        });
        return;
      }

      // Log successful verification
      this.logVerification('success');

    } catch (error) {
      this.logVerification('error', error.message);
    }
  }

  /**
   * Get current user data from the system
   */
  async getCurrentUserData() {
    const apiResult = await apiService.getCurrentUser();
    if (apiResult.success) {
      return apiResult.user;
    }
    return null;
  }

  /**
   * Handle status changes
   */
  handleStatusChange(statusChange) {
    const timestamp = new Date().toISOString();
    
    // Log the status change
    databaseService.saveSystemLog({
      type: 'status_verification',
      level: statusChange.severity,
      message: `Status change detected for user ${this.currentUser.email}: ${statusChange.message}`,
      details: {
        userId: this.currentUser.id,
        userEmail: this.currentUser.email,
        changeType: statusChange.type,
        action: statusChange.action,
        timestamp
      }
    });

    // Call the status change callback if available
    if (this.statusChangeHandler && typeof this.statusChangeHandler === 'function') {
      try {
        this.statusChangeHandler(statusChange);
      } catch (error) {
        }
    } else if (this.onStatusChange) {
      this.onStatusChange(statusChange);
    }

    // Fallback: use custom events if no handler
    if (!this.statusChangeHandler && !this.onStatusChange) {
      switch (statusChange.type) {
        case 'account_deactivated':
        case 'user_deleted':
          window.dispatchEvent(new CustomEvent('forceLogout', {
            detail: { reason: statusChange.message }
          }));
          break;
          
        case 'role_changed':
        case 'permissions_changed':
          window.dispatchEvent(new CustomEvent('userDataChanged', {
            detail: { newUserData: statusChange.newUserData, reason: statusChange.message }
          }));
          break;
          
        default:
          window.dispatchEvent(new CustomEvent('statusNotification', {
            detail: { type: statusChange.type, message: statusChange.message }
          }));
          break;
      }
    }
  }

  /**
   * Log verification attempts
   */
  logVerification(status, error = null) {
    const logEntry = {
      type: 'status_verification',
      level: status === 'success' ? 'info' : 'error',
      message: `Status verification ${status} for user ${this.currentUser.email}`,
      details: {
        userId: this.currentUser.id,
        userEmail: this.currentUser.email,
        timestamp: new Date().toISOString(),
        status
      }
    };

    if (error) {
      logEntry.details.error = error;
    }

    databaseService.saveSystemLog(logEntry);
  }

  /**
   * Set verification frequency
   * @param {number} frequency - Frequency in milliseconds
   */
  setVerificationFrequency(frequency) {
    this.verificationFrequency = frequency;
    
    if (this.isRunning) {
      // Restart with new frequency
      const user = this.currentUser;
      const callback = this.onStatusChange;
      this.stop();
      this.start(user, callback);
    }
  }

  /**
   * Get current verification status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentUser: this.currentUser ? {
        id: this.currentUser.id,
        email: this.currentUser.email,
        role: this.currentUser.role
      } : null,
      verificationFrequency: this.verificationFrequency
    };
  }
}

// Create and export singleton instance
const statusVerificationService = new StatusVerificationService();
export { statusVerificationService };
export default statusVerificationService;