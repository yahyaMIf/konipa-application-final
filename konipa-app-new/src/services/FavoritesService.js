// Service for managing user favorites
class FavoritesService {
  constructor() {
    this.storageKey = 'konipa_favorites';
  }

  // Get favorites for a user
  getFavorites(userId) {
    try {
      const favorites = localStorage.getItem(`${this.storageKey}_${userId}`);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      return [];
    }
  }

  // Add product to favorites
  addToFavorites(userId, productId) {
    try {
      const favorites = this.getFavorites(userId);
      if (!favorites.includes(productId)) {
        favorites.push(productId);
        localStorage.setItem(`${this.storageKey}_${userId}`, JSON.stringify(favorites));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Remove product from favorites
  removeFromFavorites(userId, productId) {
    try {
      const favorites = this.getFavorites(userId);
      const updatedFavorites = favorites.filter(id => id !== productId);
      localStorage.setItem(`${this.storageKey}_${userId}`, JSON.stringify(updatedFavorites));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check if product is in favorites
  isFavorite(userId, productId) {
    const favorites = this.getFavorites(userId);
    return favorites.includes(productId);
  }

  // Get favorites count
  getFavoritesCount(userId) {
    return this.getFavorites(userId).length;
  }

  // Clear all favorites for a user
  clearFavorites(userId) {
    try {
      localStorage.removeItem(`${this.storageKey}_${userId}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const favoritesService = new FavoritesService();
export default favoritesService;
