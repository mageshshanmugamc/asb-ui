import { UserManager, WebStorageStateStore, User } from "oidc-client-ts";

const AUTHORITY = "http://localhost:5000/keycloak/realms/asb-keycloak";
const CLIENT_ID = "asb-oidc-provider";
const REDIRECT_URI = window.location.origin + "/";
const POST_LOGOUT_REDIRECT_URI = window.location.origin + "/";

export const userManager = new UserManager({
  authority: AUTHORITY,
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  post_logout_redirect_uri: POST_LOGOUT_REDIRECT_URI,
  response_type: "code",
  scope: "openid profile email",
  userStore: new WebStorageStateStore({ store: sessionStorage }),
  automaticSilentRenew: true,
});

let initPromise: Promise<User | null> | null = null;

export const initAuth = (): Promise<User | null> => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Check if this is a redirect callback from the IdP
    if (window.location.search.includes("code=") || window.location.search.includes("error=")) {
      const user = await userManager.signinRedirectCallback();
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return user;
    }

    // Check if user is already signed in
    const user = await userManager.getUser();
    if (user && !user.expired) {
      return user;
    }

    // No session — redirect to login
    await userManager.signinRedirect();
    return null;
  })().catch((err) => {
    initPromise = null;
    throw err;
  });

  return initPromise;
};

export const logout = (): void => {
  sessionStorage.removeItem("app_token");
  userManager.signoutRedirect();
};

export const getAccessToken = async (): Promise<string | null> => {
  const user = await userManager.getUser();
  return user?.access_token ?? null;
};
