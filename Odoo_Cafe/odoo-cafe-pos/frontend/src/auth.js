const TOKEN_KEY = "ODOO_CAFE_POS_TOKEN";
const USER_ROLE_KEY = "ODOO_CAFE_USER_ROLE";
const USER_ID_KEY = "ODOO_CAFE_USER_ID";
const USER_NAME_KEY = "ODOO_CAFE_USER_NAME";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const getUserRole = () => localStorage.getItem(USER_ROLE_KEY);
export const setUserRole = (role) => localStorage.setItem(USER_ROLE_KEY, role);
export const removeUserRole = () => localStorage.removeItem(USER_ROLE_KEY);

export const getUserId = () => localStorage.getItem(USER_ID_KEY);
export const setUserId = (id) => localStorage.setItem(USER_ID_KEY, String(id));
export const removeUserId = () => localStorage.removeItem(USER_ID_KEY);

export const getUserName = () => localStorage.getItem(USER_NAME_KEY);
export const setUserName = (name) => localStorage.setItem(USER_NAME_KEY, name);
export const removeUserName = () => localStorage.removeItem(USER_NAME_KEY);

export const isAuthenticated = () => Boolean(getToken());

export const logout = () => {
  removeToken();
  removeUserRole();
  removeUserId();
  removeUserName();
  window.location.href = "/login";
};

export const getCurrentUser = () => ({
  id: getUserId(),
  role: getUserRole(),
  name: getUserName(),
});
