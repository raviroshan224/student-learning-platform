/**
 * Mock Authentication Service
 *
 * Validates demo credentials and manages the auth_session cookie
 * that is read by the Next.js proxy (middleware) for route protection.
 */

import { DEMO_EMAIL, DEMO_PASSWORD, MOCK_USER } from "./data";
import type { User } from "@/types/models/user";

export interface AuthResult {
  user: User;
  accessToken: string;
}

function setAuthCookie() {
  if (typeof document !== "undefined") {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `auth_session=1; path=/; expires=${expires}; SameSite=Lax`;
  }
}

function clearAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "auth_session=; path=/; max-age=0; SameSite=Lax";
  }
}

export const mockAuthService = {
  async login(email: string, password: string): Promise<AuthResult> {
    await new Promise((r) => setTimeout(r, 600)); // simulate network delay

    if (
      email.toLowerCase() === DEMO_EMAIL.toLowerCase() &&
      password === DEMO_PASSWORD
    ) {
      setAuthCookie();
      return {
        user: MOCK_USER,
        accessToken: "mock-access-token-" + Date.now(),
      };
    }

    throw new Error("Invalid email or password.");
  },

  async register(name: string, email: string, _password: string): Promise<AuthResult> {
    await new Promise((r) => setTimeout(r, 800));

    // In dummy mode, any registration succeeds (except existing demo email)
    if (email.toLowerCase() === DEMO_EMAIL.toLowerCase()) {
      throw new Error("An account with this email already exists.");
    }

    const newUser: User = {
      ...MOCK_USER,
      id: "u-" + Date.now(),
      name,
      email,
      enrolledCourses: [],
    };

    setAuthCookie();
    return {
      user: newUser,
      accessToken: "mock-access-token-" + Date.now(),
    };
  },

  logout() {
    clearAuthCookie();
  },
};
