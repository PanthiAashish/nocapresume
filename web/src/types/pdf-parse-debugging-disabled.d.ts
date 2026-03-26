declare module "pdf-parse-debugging-disabled" {
  type PdfParseResult = {
    text: string
  }

  export default function pdfParse(dataBuffer: Buffer): Promise<PdfParseResult>
}
