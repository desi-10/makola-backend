import { OAuth2Client } from "google-auth-library";

export const googleOAuthClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI!, // e.g. http://localhost:5000/api/v1/auth/google/callback
});

export const GOOGLE_SCOPES = ["openid", "profile", "email"];
