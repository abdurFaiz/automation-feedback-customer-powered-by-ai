import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { db } from "@/server/db";
import { env } from "@/env";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authConfig = {
  secret: env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number.parseInt(process.env.EMAIL_SERVER_PORT ?? "587"),
        secure: process.env.EMAIL_SERVER_PORT === "465",
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({
        identifier: email,
        url,
        provider,
      }) => {
        try {
          const { host } = new URL(url);
          // eslint-disable-next-line @typescript-eslint/consistent-type-imports
          const nodemailer = await import("nodemailer");

          const server = provider.server as {
            host: string;
            port: number;
            secure: boolean;
            auth: { user: string; pass: string };
          };

          const transport = nodemailer.default.createTransport({
            host: server.host,
            port: server.port,
            secure: server.secure,
            auth: server.auth,
          });

          await transport.sendMail({
            to: email,
            from: provider.from,
            subject: `Login ke ${host}`,
            text: `Klik link berikut untuk login:\n\n${url}\n\n`,
            html: `
              <!DOCTYPE html>
              <html>
                <body style="font-family: Arial, sans-serif; background: #f5f5f5;">
                  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #333;">Verifikasi Email Anda</h2>
                    <p style="color: #666; line-height: 1.6;">
                      Terima kasih telah mendaftar. Klik tombol di bawah untuk memverifikasi email Anda dan login ke akun.
                    </p>
                    <a href="${url}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: bold;">
                      Login ke ${host}
                    </a>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                      Jika Anda tidak meminta login, abaikan email ini.
                    </p>
                  </div>
                </body>
              </html>
            `,
          });

        } catch (error) {
          throw error;
        }
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(db as any),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    verifyRequest: "/auth/verify-email",
  },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub!,
      },
    }),
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
} satisfies NextAuthOptions;