import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Expert from "@/models/Expert";
import { verifyToken } from "@/lib/auth";

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const id = (await params).id;
    const body = await req.json();

    if (body.expertiseKeywords && typeof body.expertiseKeywords === "string") {
      body.expertiseKeywords = body.expertiseKeywords.split(",").map((k) => k.trim());
    }

    const updated = await Expert.findOneAndUpdate({ _id: id, userId: decoded.userId }, body, { new: true });
    if (!updated) {
      return NextResponse.json({ message: "Expert not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Expert updated successfully", expert: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const id = (await params).id;
    const deleted = await Expert.findOneAndDelete({ _id: id, userId: decoded.userId });
    if (!deleted) {
      return NextResponse.json({ message: "Expert not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Expert deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
