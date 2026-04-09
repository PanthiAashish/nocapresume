import path from "node:path"
import { pathToFileURL } from "node:url"
import { registerHooks } from "node:module"

const projectRoot = process.cwd()

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const targetPath = path.join(projectRoot, "src", specifier.slice(2))
      return nextResolve(pathToFileURL(`${targetPath}.ts`).href, context)
    }

    return nextResolve(specifier, context)
  },
})
