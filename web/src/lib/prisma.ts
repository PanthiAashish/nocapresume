import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

function createPrismaClient() {
  return new PrismaClient({
    log: ["error"],
  })
}

function hasCurrentProfileModels(client: PrismaClient) {
  return "user" in client && "baseResume" in client && "profile" in client
}

export const prisma =
  globalForPrisma.prisma && hasCurrentProfileModels(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
