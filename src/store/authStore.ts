import { create } from "zustand";
import {
  signIn,
  signOut,
  getCurrentUser,
  fetchUserAttributes,
  confirmSignIn,
  fetchAuthSession,
} from "aws-amplify/auth";
import type { User } from "@/types/academic-new";
import type { User as BackendUser } from "@/types/permissions";
import type { AppAbility } from "@/lib/abilityBuilder";
import { buildAbilityFrom, createEmptyAbility } from "@/lib/abilityBuilder";
import { authService } from "@/services/authService";

interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
}

interface AuthState {
  user: User | null;
  backendUser: BackendUser | null; // Usuario con información de roles del backend
  ability: AppAbility; // Permisos CASL
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsPasswordChange: boolean;
  tempEmail: string | null; // Para recordar el email durante el cambio de contraseña

  // Actions
  login: (email: string, password: string) => Promise<void>;
  confirmNewPassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  getAccessToken: () => string | null;
  fetchUserPermissions: () => Promise<void>; // Obtener usuario y permisos del backend
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  backendUser: null,
  ability: createEmptyAbility(),
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  needsPasswordChange: false,
  tempEmail: null,

  login: async (email: string, password: string) => {
    set({
      isLoading: true,
      error: null,
      backendUser: null,
      ability: createEmptyAbility(),
    });
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        const cognitoUser = await getCurrentUser();

        const attributes = await fetchUserAttributes();

        // Obtener tokens JWT de la sesión
        const session = await fetchAuthSession();
        const tokens: AuthTokens | null = session.tokens
          ? {
              accessToken: session.tokens.accessToken.toString(),
              idToken: session.tokens.idToken?.toString() || "",
            }
          : null;

        const user: User = {
          userId: parseInt(cognitoUser.userId) || 1,
          externalAuthId: cognitoUser.userId,
          authProvider: "AWS_COGNITO",
          email: attributes.email || email,
          firstName: attributes.given_name || "",
          lastName: attributes.family_name || "",
          roleId: 0, // El rol autoritativo se obtiene del backend.
          isActive: true,
        };

        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          needsPasswordChange: false,
          tempEmail: null,
        });
      } else if (nextStep) {
        // Manejar el caso de cambio de contraseña requerido
        if (
          nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
        ) {
          set({
            needsPasswordChange: true,
            tempEmail: email,
            isLoading: false,
            error: null,
          });
        } else {
          set({
            error: `Se requiere completar: ${nextStep.signInStep}`,
            isLoading: false,
            isAuthenticated: false,
            needsPasswordChange: false,
          });
        }
      }
    } catch (error: any) {
      let errorMessage = "Error al iniciar sesión";

      // Manejo de errores específicos de Cognito
      if (error.name === "NotAuthorizedException") {
        errorMessage = "Usuario o contraseña incorrectos";
      } else if (error.name === "UserNotFoundException") {
        errorMessage = "Usuario no encontrado";
      } else if (error.name === "UserNotConfirmedException") {
        errorMessage = "Usuario no confirmado. Verifica tu email.";
      } else if (error.name === "PasswordResetRequiredException") {
        errorMessage = "Debes restablecer tu contraseña";
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },

  logout: async () => {
    try {
      await signOut();
      set({
        user: null,
        backendUser: null,
        ability: createEmptyAbility(),
        tokens: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error: any) {
      set({ error: error.message || "Error al cerrar sesión" });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const cognitoUser = await getCurrentUser();

      const attributes = await fetchUserAttributes();

      // Obtener tokens de la sesión existente
      const session = await fetchAuthSession();
      const tokens: AuthTokens | null = session.tokens
        ? {
            accessToken: session.tokens.accessToken.toString(),
            idToken: session.tokens.idToken?.toString() || "",
          }
        : null;

      const user: User = {
        userId: parseInt(cognitoUser.userId) || 1,
        externalAuthId: cognitoUser.userId,
        authProvider: "AWS_COGNITO",
        email: attributes.email || "",
        firstName: attributes.given_name || "",
        lastName: attributes.family_name || "",
        roleId: 0,
        isActive: true,
      };

      set({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        backendUser: null,
        ability: createEmptyAbility(),
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  confirmNewPassword: async (newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      const { isSignedIn } = await confirmSignIn({
        challengeResponse: newPassword,
      });

      if (isSignedIn) {
        const cognitoUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const tempEmail = get().tempEmail;
        const session = await fetchAuthSession();
        const tokens: AuthTokens | null = session.tokens
          ? {
              accessToken: session.tokens.accessToken.toString(),
              idToken: session.tokens.idToken?.toString() || "",
            }
          : null;

        const user: User = {
          userId: parseInt(cognitoUser.userId) || 1,
          externalAuthId: cognitoUser.userId,
          authProvider: "AWS_COGNITO",
          email: attributes.email || tempEmail || "",
          firstName: attributes.given_name || "",
          lastName: attributes.family_name || "",
          roleId: 0,
          isActive: true,
        };

        set({
          user,
          tokens,
          isAuthenticated: !!tokens?.accessToken,
          isLoading: false,
          error: null,
          needsPasswordChange: false,
          tempEmail: null,
        });
      } else {
        set({
          error: "No se pudo completar el cambio de contraseña",
          isLoading: false,
        });
      }
    } catch (error: any) {
      let errorMessage = "Error al cambiar la contraseña";

      if (error.name === "InvalidPasswordException") {
        errorMessage =
          "La contraseña no cumple con los requisitos de seguridad";
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  getAccessToken: () => {
    const state = get();
    return state.tokens?.accessToken || null;
  },

  fetchUserPermissions: async () => {
    try {
      const response = await authService.getMe();

      // El backend puede devolver { user, abilities } o un objeto usuario plano con abilities.
      // Normalizamos ambas formas aquí.
      const rawUser: any = (response as any).user ?? response;
      const abilities = (response as any).abilities ?? rawUser?.abilities ?? [];

      // Mapear shape de rol { id, roleName } -> { roleId, roleName }
      const normalizedRole = rawUser?.role
        ? {
            roleId:
              (rawUser.role.roleId as number) ?? (rawUser.role.id as number),
            roleName: rawUser.role.roleName,
          }
        : undefined;

      if (
        !normalizedRole ||
        !["Admin", "Teacher", "Student"].includes(normalizedRole.roleName)
      ) {
        throw new Error("El usuario no tiene un rol habilitado en BioRepo");
      }

      const backendUser = rawUser
        ? {
            userId: rawUser.userId,
            email: rawUser.email,
            firstName: rawUser.firstName ?? "",
            lastName: rawUser.lastName ?? "",
            cognitoId:
              (rawUser.cognitoId as string) ??
              (rawUser.externalAuthId as string),
            role: normalizedRole,
            createdAt: rawUser.createdAt,
            updatedAt: rawUser.updatedAt,
          }
        : null;

      // Construir ability desde las reglas del backend
      const ability = buildAbilityFrom(abilities);

      set({ backendUser, ability });
    } catch (error: any) {
      // Si es 401, limpiar sesión y redirigir a login
      if (error.message?.includes("401")) {
        await get().logout();
        return;
      }

      // Para otros errores, mantener ability vacío
      set({
        backendUser: null,
        ability: createEmptyAbility(),
      });
    }
  },
}));
