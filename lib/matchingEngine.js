import natural from "natural";

// TF-IDF Vectorization + Cosine Similarity + Experience Weight
export function findTopExperts(candidateKeywords, experts) {
  if (!experts || experts.length === 0) return [];
  if (!candidateKeywords || candidateKeywords.length === 0) return [];

  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();

  // Create documents for TF-IDF
  // Document 0: Candidate
  tfidf.addDocument(candidateKeywords.join(" "));

  // Documents 1 to N: Experts
  experts.forEach((expert) => {
    tfidf.addDocument(expert.expertiseKeywords.join(" "));
  });

  // Extract vectors for each document
  // natural's TfIdf doesn't directly expose vectors easily, so we build them
  // All terms across candidate and all experts
  const allTerms = new Set();
  candidateKeywords.forEach(t => allTerms.add(t));
  experts.forEach(expert => expert.expertiseKeywords.forEach(t => allTerms.add(t)));
  const termsArray = Array.from(allTerms);

  // Build Candidate Vector
  const candidateVector = getVector(tfidf, 0, termsArray);

  // Calculate Max Experience for Normalization
  const maxExp = Math.max(...experts.map((e) => e.experienceYears), 1); // Avoid div by 0

  const results = experts.map((expert, index) => {
    const expertDocIndex = index + 1;
    const expertVector = getVector(tfidf, expertDocIndex, termsArray);
    
    const cosineSim = calculateCosineSimilarity(candidateVector, expertVector);
    const normalizedExp = expert.experienceYears / maxExp;

    // Final Score Formula from Requirements: 0.7 * Cosine + 0.3 * Experience
    const finalScore = (0.7 * cosineSim) + (0.3 * normalizedExp);

    // Provide explainability terms (intersected keywords)
    const matchedTerms = candidateKeywords.filter(keyword => 
      expert.expertiseKeywords.map(k => k.toLowerCase()).includes(keyword.toLowerCase())
    );

    return {
      expert,
      cosineSimilarity: cosineSim,
      normalizedExperience: normalizedExp,
      finalScore: finalScore,
      matchedKeywords: matchedTerms
    };
  });

  // Sort experts by highest Final Score
  results.sort((a, b) => b.finalScore - a.finalScore);

  // Return Top 4
  return results.slice(0, 4);
}

function getVector(tfidf, docIndex, termsArray) {
  const vector = [];
  termsArray.forEach((term) => {
    vector.push(tfidf.tfidf(term, docIndex));
  });
  return vector;
}

function calculateCosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
