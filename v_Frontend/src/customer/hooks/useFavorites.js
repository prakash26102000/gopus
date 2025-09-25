import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { BASE_URL } from '../../util';

const getApiUrl = (path) => `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const useFavorites = (productId, onLoginRequired) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkIsFavorited = async () => {
      const token = localStorage.getItem('token');
      if (!token || !productId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(getApiUrl('/api/favorites'), { headers: { Authorization: `Bearer ${token}` } });
        const userFavorites = response.data?.favorites || [];
        setIsFavorited(userFavorites.some(fav => fav.productId === parseInt(productId, 10)));
      } catch (error) {
        console.error('Error fetching user favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkIsFavorited();
  }, [productId]);

  const toggleFavorite = async (productName) => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (onLoginRequired) {
        onLoginRequired({ action: 'favorite', productName });
      }
      return;
    }

    const optimisticNewState = !isFavorited;
    setIsFavorited(optimisticNewState);

    try {
      if (optimisticNewState) {
        await axios.post(getApiUrl(`/api/favorites/${productId}`), {}, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(`${productName} added to favorites`);
      } else {
        await axios.delete(getApiUrl(`/api/favorites/${productId}`), { headers: { Authorization: `Bearer ${token}` } });
        toast.success(newIsFavorited ? `${productName} added to favorites` : `${productName} removed from favorites`);
      }
      window.dispatchEvent(new CustomEvent('favoritesUpdate'));
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error(`Failed to update favorites. Please try again.`);
      setIsFavorited(!optimisticNewState); // Revert on error
    }
  };

  return { isFavorited, toggleFavorite, isLoadingFavorites: isLoading };
};
