import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { authService, AppTokenResponse, MenuModel } from "../services/auth.service";

interface AppAuthState {
  loading: boolean;
  roles: string[];
  menus: MenuModel[];
  allowedRoutes: Set<string>;
  appToken: string | null;
  error: string | null;
}

const AppAuthContext = createContext<AppAuthState>({
  loading: true,
  roles: [],
  menus: [],
  allowedRoutes: new Set(),
  appToken: null,
  error: null,
});

export const useAppAuth = () => useContext(AppAuthContext);

function collectRoutes(menus: MenuModel[]): Set<string> {
  const routes = new Set<string>();
  routes.add("/"); // root is always allowed
  for (const menu of menus) {
    routes.add(menu.route);
    for (const child of menu.children) {
      routes.add(child.route);
    }
  }
  return routes;
}

export const AppAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<Omit<AppAuthState, "allowedRoutes">>({
    loading: true,
    roles: [],
    menus: [],
    appToken: null,
    error: null,
  });

  const allowedRoutes = useMemo(() => collectRoutes(state.menus), [state.menus]);

  useEffect(() => {
    const subscription = authService.exchangeToken$().subscribe({
      next: (response) => {
        // Store the app token in sessionStorage for API calls
        sessionStorage.setItem("app_token", response.access_token);
        setState({
          loading: false,
          roles: response.roles,
          menus: response.menus,
          appToken: response.access_token,
          error: null,
        });
      },
      error: (err) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message,
        }));
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AppAuthContext.Provider value={{ ...state, allowedRoutes }}>
      {children}
    </AppAuthContext.Provider>
  );
};
