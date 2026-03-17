import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Candidate from "@/models/Candidate";
import { extractTextFromFile, extractKeywords } from "@/lib/resumeParser";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req) {
  try {
    await connectToDatabase();
    const data = await req.formData();
    
    const file = data.get("resume");
    const name = data.get("name");
    const email = data.get("email");

    if (!file || !name || !email) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Check if duplicate candidate
    const existing = await Candidate.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: "Candidate with this email already exists" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save File locally (simplified for local development approach)
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true }).catch(console.error);
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Parse text
    const extractedText = await extractTextFromFile(buffer, file.type);
    
    // Extract keywords
    const keywords = extractKeywords(extractedText);

    // Save candidate
    const candidate = await Candidate.create({
      name,
      email,
      resumeFile: `/uploads/${filename}`,
      extractedText,
      keywords,
    });

    return NextResponse.json({ message: "Candidate processed successfully", candidate }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
