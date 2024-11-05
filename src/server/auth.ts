import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { compare } from "bcryptjs";
import { type UserRole } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,

  jwt: {
    secret: process.env.NEXTAUTH_SECRET, // Reusing the same secret
    maxAge: 30 * 24 * 60 * 60,
    encode: async ({ token, secret }) => {
      try {
        // Ensure the secret is a string
        const secretKey =
          typeof secret === "string" ? secret : secret.toString();

        // Create a new JWT with the provided secret and token payload
        return await new SignJWT(token as Record<string, unknown>)
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("30d")
          .setIssuedAt()
          .setNotBefore("0s")
          .sign(new TextEncoder().encode(secretKey));
      } catch (error) {
        console.error("JWT Encode Error:", error);
        throw new Error("Failed to encode JWT");
      }
    },
    decode: async ({ token, secret }) => {
      try {
        // Handle the case where token or secret is undefined
        if (!token) {
          throw new Error("Token is undefined");
        }

        const secretKey =
          typeof secret === "string" ? secret : (secret?.toString() ?? "");

        // Verify and decode the provided JWT using the secret
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(secretKey),
        );
        return payload;
      } catch (error) {
        console.error("JWT Decode Error:", error);
        return null;
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user?.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);
