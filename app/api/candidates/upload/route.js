import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Candidate from "@/models/Candidate";
import { extractTextFromFile, extractKeywords } from "@/lib/resumeParser";
import { verifyToken } from "@/lib/auth";
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

    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if duplicate candidate
    const existing = await Candidate.findOne({ email, userId: decoded.userId });
    if (existing) {
      return NextResponse.json({ message: "Candidate with this email already exists" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save File locally (simplified for local development approach)
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    try {
      const isProduction = process.env.NODE_ENV === "production";
      const uploadsDir = isProduction ? "/tmp" : path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      const filepath = path.join(uploadsDir, filename);
      await writeFile(filepath, buffer);
    } catch (fileError) {
      console.warn("Could not save file to disk:", fileError);
    }

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
      userId: decoded.userId,
    });

    return NextResponse.json({ message: "Candidate processed successfully", candidate }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
