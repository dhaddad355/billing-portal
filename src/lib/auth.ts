import { NextAuthOptions, Session } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { getServiceClient } from "@/lib/supabase";
import { JWT } from "next-auth/jwt";

// Validate required environment variables
const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'AZURE_AD_CLIENT_ID',
  'AZURE_AD_CLIENT_SECRET',
  'AZURE_AD_TENANT_ID'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
}

interface ExtendedToken extends JWT {
  userId?: string;
  azureOid?: string;
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    azureOid: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/api/auth/signout",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "azure-ad") {
        console.log("❌ Sign-in rejected: Not Azure AD provider");
        return false;
      }

      try {
        const supabase = getServiceClient();
        const azureOid = (profile as { oid?: string })?.oid || account.providerAccountId;
        const email = user.email || "";
        const displayName = user.name || email.split("@")[0];

        console.log("🔐 Attempting to upsert user:", {
          azureOid,
          email,
          displayName,
        });

        // Upsert user into database
        const { data, error } = await supabase
          .from("users")
          .upsert(
            {
              azure_oid: azureOid,
              email: email,
              display_name: displayName,
              is_active: true,
            },
            {
              onConflict: "azure_oid",
            }
          )
          .select();

        if (error) {
          console.error("❌ Error upserting user to database:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          // Continue with login even if upsert fails
        } else {
          console.log("✅ User upserted successfully:", data);
        }

        return true;
      } catch (error) {
        console.error("❌ Exception in signIn callback:", error);
        return true; // Still allow sign in
      }
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const azureOid = (profile as { oid?: string })?.oid || account.providerAccountId;
        (token as ExtendedToken).azureOid = azureOid;

        console.log("🔑 JWT callback - Looking up user by Azure OID:", azureOid);

        // Get user ID from database
        try {
          const supabase = getServiceClient();
          const { data, error } = await supabase
            .from("users")
            .select("id")
            .eq("azure_oid", azureOid)
            .single();

          if (error) {
            console.error("❌ Error fetching user ID from database:", error);
          } else if (data) {
            console.log("✅ Found user in database:", data.id);
            (token as ExtendedToken).userId = data.id;
          } else {
            console.warn("⚠️ No user found in database for Azure OID:", azureOid);
          }
        } catch (error) {
          console.error("❌ Exception fetching user ID:", error);
        }
      }
      return token;
    },
    async session({ session, token }): Promise<ExtendedSession> {
      const extendedToken = token as ExtendedToken;
      return {
        ...session,
        user: {
          ...session.user,
          id: extendedToken.userId || "",
          azureOid: extendedToken.azureOid || "",
        },
      };
    },
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};
