import pdfParse from "pdf-parse-debugging-disabled"

export async function extractPdfText(bytes: Buffer) {
  const result = await pdfParse(bytes)
  return result.text.trim()
}
