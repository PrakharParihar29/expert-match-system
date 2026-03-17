import mammoth from "mammoth";
import natural from "natural";
import PDFParser from "pdf2json";

export async function extractTextFromFile(buffer, mimetype) {
  let text = "";

  if (mimetype === "application/pdf") {
    text = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(this, 1);
      
      pdfParser.on("pdfParser_dataError", (errData) => reject(new Error(errData.parserError)));
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });
      
      pdfParser.parseBuffer(buffer);
    });
  } else if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    const data = await mammoth.extractRawText({ buffer });
    text = data.value;
  } else {
    throw new Error("Unsupported file format. Please upload PDF or DOCX.");
  }

  return cleanText(text);
}

function cleanText(text) {
  // Remove non-alphanumeric, keep spaces
  let cleaned = text.replace(/[^a-zA-Z0-9\s]/g, " ");
  // Lowercase
  cleaned = cleaned.toLowerCase();
  // Remove extra spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

export function extractKeywords(text, maxKeywords = 15) {
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text);

  // Remove stop words using English stopwords array
  const stopWordsObj = new Set(natural.stopwords || []);
  const filteredTokens = tokens.filter(token => !stopWordsObj.has(token.toLowerCase()));

  // Frequency map
  const wordFreq = {};
  filteredTokens.forEach((word) => {
    // Only keep words longer than 2 characters and not just numbers
    if (word.length > 2 && isNaN(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // Sort by frequency
  const sortedKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map((entry) => entry[0]);

  return sortedKeywords;
}
