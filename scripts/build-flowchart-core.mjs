import fs from "node:fs"
import path from "node:path"

const dir = path.resolve("src/services/flowchart")
const partsDir = path.join(dir, "parts")
const files = fs
  .readdirSync(partsDir)
  .filter(name => name.endsWith(".js"))
  .sort()

const chunks = []
for (const name of files) {
  const content = fs.readFileSync(path.join(partsDir, name), "utf8")
  chunks.push("// <part:" + name + ">")
  chunks.push(content)
  chunks.push("// </part:" + name + ">")
  chunks.push("")
}
const body = chunks.join(String.fromCharCode(10))
fs.writeFileSync(path.join(dir, "core.js"), body)
console.log("built core.js from", files.length, "parts")
