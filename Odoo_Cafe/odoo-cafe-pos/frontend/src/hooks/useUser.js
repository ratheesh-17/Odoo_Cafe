import { useEffect, useState } from "react";
import api from "../api";
import { getToken, getUserRole, getUserId, getUserName } from "../auth";

/**
 * Hook to get current user information
 * Returns user data from localStorage first, then fetches from API if needed
 */
export const useUser = () => {
  const [user, setUser] = useState({
    id: getUserId(),
    role: getUserRole(),
    name: getUserName(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch full user info from API on mount if we have a token
  useEffect(() => {
    if (getToken() && !user.id) {
      fetchUser();
    }
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/auth/me");
      setUser({
        id: data.id,
        role: data.role,
        name: data.name,
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch user");
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, fetchUser };
};

export default useUser;
