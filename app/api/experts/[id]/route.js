import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Expert from "@/models/Expert";

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const id = (await params).id;
    const body = await req.json();

    if (body.expertiseKeywords && typeof body.expertiseKeywords === "string") {
      body.expertiseKeywords = body.expertiseKeywords.split(",").map((k) => k.trim());
    }

    const updated = await Expert.findByIdAndUpdate(id, body, { new: true });
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
    const id = (await params).id;
    const deleted = await Expert.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Expert not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Expert deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
