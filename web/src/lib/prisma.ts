import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis

export const prisma =
  (globalForPrisma as any).prisma ||
  new PrismaClient({
    log: ["error"],
  })

if (process.env.NODE_ENV !== "production") (globalForPrisma as any).prisma = prisma
