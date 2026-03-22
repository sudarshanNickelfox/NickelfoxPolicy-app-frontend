import type { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials?.email, password: credentials?.password }),
          });
          if (!res.ok) return null;
          const json = await res.json();
          if (!json.success) return null;
          const { token, user } = json.data;
          return { id: user.id, name: user.name, email: user.email, role: user.role, accessToken: token };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Credentials login — backend already returned a signed JWT
      if (user) {
        token.role = (user as { role?: string }).role ?? 'employee';
        token.accessToken = (user as { accessToken?: string }).accessToken;
      }

      // Azure AD login — exchange id_token for a backend-signed JWT
      if (account?.provider === 'azure-ad' && account.id_token) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
          const res = await fetch(`${apiUrl}/api/auth/azure-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: account.id_token }),
          });
          if (res.ok) {
            const json = await res.json();
            token.accessToken = json.data.token;
            token.role = json.data.user.role ?? 'employee';
          }
        } catch {
          // leave token.accessToken undefined — protected routes will reject
        }
      }

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string | undefined,
        role: (token.role as string | undefined) ?? 'employee',
      };
    },
  },
};
