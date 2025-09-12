import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { ceoJournalService } from '../services/ceoJournalService';
import authService from '../services/authService';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'client'
  });

  // Vérifier si l'utilisateur est admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>Accès refusé</h2>
          <p>Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadUsers(showPasswords);
  }, [showPasswords]);

  const togglePasswordVisibility = () => {
    setShowPasswords(!showPasswords);
  };

  const loadUsers = async (withPasswords = false) => {
    try {
      setLoading(true);
      const result = await authService.getAllUsers();
      
      if (result.success) {
        setUsers(result.users || []);
      } else {
        setError(result.error || 'Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.post('admin/users', formData);
      
      // Logger la création d'utilisateur dans le journal CEO
      adminJournalService.logUserCreation(formData.email, formData.role, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        createdBy: user?.email || 'Admin',
        createdById: user?.id
      });
      
      setShowCreateForm(false);
      setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'client' });
      loadUsers();
    } catch (err) {
      setError('Erreur lors de la création de l\'utilisateur');
      }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await apiService.put(`admin/users/${editingUser.id}`, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role
      });
      setEditingUser(null);
      setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'client' });
      loadUsers();
    } catch (err) {
      setError('Erreur lors de la modification de l\'utilisateur');
      }
  };

  const handleChangePassword = async (userId, newPassword) => {
    try {
      await apiService.put(`admin/users/${userId}/password`, { password: newPassword });
      alert('Mot de passe modifié avec succès');
    } catch (err) {
      setError('Erreur lors de la modification du mot de passe');
      }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await apiService.put(`admin/users/${userId}/toggle-status`);
      loadUsers();
    } catch (err) {
      setError('Erreur lors de la modification du statut');
      }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await apiService.delete(`admin/users/${userId}`);
        loadUsers();
      } catch (err) {
        setError('Erreur lors de la suppression de l\'utilisateur');
        }
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'client' });
  };

  if (loading) {
    return <div className="admin-panel loading">Chargement...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Panneau d'Administration</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Créer un utilisateur
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Créer un nouvel utilisateur</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mot de passe:</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Prénom:</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nom:</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rôle:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="client">Client</option>
                  <option value="commercial">Commercial</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Créer</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire de modification */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Modifier l'utilisateur</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Prénom:</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nom:</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rôle:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="client">Client</option>
                  <option value="commercial">Commercial</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Modifier</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={cancelEdit}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des utilisateurs */}
      <div className="users-table">
        <div className="table-controls">
          <button 
            className={`btn ${showPasswords ? 'btn-primary' : 'btn-secondary'}`}
            onClick={togglePasswordVisibility}
          >
            {showPasswords ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              {showPasswords && <th>Mot de passe</th>}
              <th>Nom</th>
              <th>Prénom</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                {showPasswords && (
                  <td>
                    <input 
                      type="text" 
                      value={user.password || '••••••••'}
                      onChange={(e) => {
                        const updatedUsers = users.map(u => 
                          u.id === user.id ? {...u, password: e.target.value} : u
                        );
                        setUsers(updatedUsers);
                      }}
                      className="password-input"
                      placeholder="Nouveau mot de passe"
                    />
                    <button 
                      className="btn btn-sm btn-save-password"
                      onClick={() => handleChangePassword(user.id, user.password)}
                      title="Sauvegarder le mot de passe"
                    >
                      💾
                    </button>
                  </td>
                )}
                <td>{user.lastName}</td>
                <td>{user.firstName}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-edit"
                      onClick={() => startEdit(user)}
                    >
                      Modifier
                    </button>
                    <button 
                      className="btn btn-sm btn-password"
                      onClick={() => {
                        const newPassword = prompt('Nouveau mot de passe:');
                        if (newPassword) {
                          handleChangePassword(user.id, newPassword);
                        }
                      }}
                    >
                      Mot de passe
                    </button>
                    <button 
                      className={`btn btn-sm ${user.isActive ? 'btn-block' : 'btn-activate'}`}
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                    >
                      {user.isActive ? 'Bloquer' : 'Activer'}
                    </button>
                    <button 
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;