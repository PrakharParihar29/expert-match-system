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
  let cleaned = text
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\S+@\S+\.[a-z]{2,}/gi, " ")
    .replace(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g, " ")
    .replace(/\b\d{4}\b/g, " ")
    .replace(/\b\(\d{3}\)\s*\d{3}[\s-]*\d{4}\b/g, " ")
    .replace(/\b\d{3}[\s-]*\d{3}[\s-]*\d{4}\b/g, " ")
    .replace(/[\r\n]+/g, " \n ")
    .replace(/[\/\(\),:;]+/g, " ")
    .replace(/[^a-zA-Z0-9\s\-\.]/g, " ");
  cleaned = cleaned.toLowerCase();
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

const RESUME_STOPWORDS = new Set([...(natural.stopwords || []),
  "resume", "cv", "linkedin", "email", "phone", "contact", "address", "objective", "summary",
  "experience", "experienced", "education", "skill", "skills", "technical", "professional",
  "responsibilities", "responsibility", "projects", "project", "work", "worked", "working",
  "team", "manager", "managed", "management", "years", "year", "months", "month",
  "degree", "bachelor", "master", "phd", "college", "university", "course", "courses",
  "certified", "certification", "certifications", "candidate", "applicant", "profile",
  "summary", "strong", "using", "used", "use", "help", "ability", "abilities",
  "proficient", "demonstrated", "including", "various", "many", "multiple",
  "workplace", "industry", "client", "clients", "business", "support", "role", "responsible",
  "responsibilities", "responsible", "experience", "skillset", "skills", "qualification", "qualifications",
  "achievements", "achievement", "good", "excellent", "team", "teams", "managed", "management", "lead",
  "senior", "junior", "mid", "level", "years", "year", "month", "months", "able", "ability",
]);

const TECH_TERMS = new Set([
  "javascript", "typescript", "python", "java", "csharp", "cpp", "go", "golang", "ruby", "rust",
  "scala", "kotlin", "php", "swift", "dart", "perl", "sql", "nosql", "mongodb", "postgresql",
  "mysql", "redis", "elasticsearch", "react", "vue", "angular", "svelte", "next", "nextjs",
  "node", "nodejs", "express", "nestjs", "django", "flask", "spring", "springboot", "laravel",
  "rails", "tensorflow", "pytorch", "keras", "scikitlearn", "pandas", "numpy", "spark", "hadoop",
  "docker", "kubernetes", "aws", "azure", "gcp", "graphql", "rest", "api", "microservices",
  "git", "github", "gitlab", "ci", "cd", "jenkins", "terraform", "ansible", "linux", "bash",
  "azuredevops", "firebase", "oracle", "jira", "confluence", "tableau", "powerbi", "matlab",
]);

const TECH_PHRASES = new Set([
  "machine learning", "deep learning", "natural language processing", "data science", "computer vision",
  "web development", "cloud computing", "distributed systems", "software engineering", "devops",
  "artificial intelligence", "data engineering", "business intelligence", "project management",
  "product management", "quality assurance", "user experience", "user interface",
]);

function normalizeToken(token) {
  const normalized = token
    .replace(/c\+\+/g, "cpp")
    .replace(/c#/g, "csharp")
    .replace(/\.net/g, "dotnet")
    .replace(/node\.js/g, "nodejs")
    .replace(/next\.js/g, "nextjs")
    .replace(/scikit[- ]learn/g, "scikitlearn")
    .replace(/natural language processing/g, "natural language processing")
    .replace(/[^a-z0-9]/g, "");
  return normalized;
}

function isValidToken(token) {
  return (
    token.length >= 3 &&
    token.length <= 30 &&
    !/^[0-9]+$/.test(token) &&
    !RESUME_STOPWORDS.has(token)
  );
}

function computeLineWeight(line) {
  const sectionBoosters = [
    "skills", "technical skills", "experience", "work experience", "professional experience",
    "projects", "certifications", "education", "summary", "responsibilities", "tools", "technologies",
    "achievements", "areas of expertise", "expertise",
  ];
  const lower = line.toLowerCase();
  let weight = 1;

  if (sectionBoosters.some((phrase) => lower.includes(phrase))) {
    weight += 1.5;
  }
  if (TECH_PHRASES.has(lower.trim())) {
    weight += 2;
  }
  if (TECH_TERMS.has(lower.trim())) {
    weight += 1.5;
  }
  if (/\b(skill|technology|tool|framework|library|platform|practice)\b/.test(lower)) {
    weight += 0.8;
  }
  return weight;
}

export function extractKeywords(text, maxKeywords = 15) {
  const cleaned = cleanText(text);
  const lines = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const tokenizer = new natural.WordTokenizer();

  const unigramScores = {};
  const phraseScores = {};

  for (const line of lines) {
    const lineWeight = computeLineWeight(line);
    const rawTokens = tokenizer.tokenize(line);
    const normalizedTokens = rawTokens.map(normalizeToken).filter(isValidToken);

    if (normalizedTokens.length === 0) {
      continue;
    }

    normalizedTokens.forEach((token) => {
      const techBoost = TECH_TERMS.has(token) ? 2 : 1;
      unigramScores[token] = (unigramScores[token] || 0) + lineWeight * techBoost;
    });

    natural.NGrams.bigrams(normalizedTokens).forEach((pair) => {
      const phrase = pair.join(" ");
      if (phrase.split(" ").some((token) => RESUME_STOPWORDS.has(token))) return;
      const phraseBoost = TECH_PHRASES.has(phrase) || pair.some((token) => TECH_TERMS.has(token)) ? 3 : 1.5;
      phraseScores[phrase] = (phraseScores[phrase] || 0) + lineWeight * phraseBoost;
    });

    natural.NGrams.trigrams(normalizedTokens).forEach((triplet) => {
      const phrase = triplet.join(" ");
      if (phrase.split(" ").some((token) => RESUME_STOPWORDS.has(token))) return;
      const phraseBoost = TECH_PHRASES.has(phrase) || triplet.some((token) => TECH_TERMS.has(token)) ? 4 : 2;
      phraseScores[phrase] = (phraseScores[phrase] || 0) + lineWeight * phraseBoost;
    });
  }

  const candidates = [];

  Object.entries(unigramScores).forEach(([term, score]) => {
    candidates.push({ term, score, type: "unigram" });
  });

  Object.entries(phraseScores).forEach(([term, score]) => {
    candidates.push({ term, score, type: term.split(" ").length === 3 ? "trigram" : "bigram" });
  });

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.term.split(" ").length !== a.term.split(" ").length) return b.term.split(" ").length - a.term.split(" ").length;
    return a.term.localeCompare(b.term);
  });

  const selected = [];
  const blocked = new Set();

  for (const candidate of candidates) {
    if (selected.length >= maxKeywords) break;
    if (blocked.has(candidate.term)) continue;

    const parts = candidate.term.split(" ");
    if (parts.some((part) => blocked.has(part))) continue;

    selected.push(candidate.term);
    parts.forEach((part) => blocked.add(part));
  }

  return selected;
}
