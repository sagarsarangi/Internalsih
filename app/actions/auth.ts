"use server";

export async function getDemoCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "password123",
  };
}
