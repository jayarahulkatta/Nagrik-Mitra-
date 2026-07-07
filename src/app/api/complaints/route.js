import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

// Generate a human-friendly complaint ID
function generateComplaintId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, "0");
  return `NM-${year}-${random}`;
}

// POST - Create a new complaint
export async function POST(request) {
  try {
    const body = await request.json();
    const { category, location, summary, rawText, citizenName, citizenPhone } =
      body;

    if (!category || !summary || !citizenPhone) {
      return NextResponse.json(
        { error: "Missing required fields: category, summary, citizenPhone" },
        { status: 400 }
      );
    }

    const complaintId = generateComplaintId();

    const complaintData = {
      complaintId,
      category: category || "other",
      location: location || "Not specified",
      summary,
      rawText: rawText || summary,
      status: "Submitted",
      citizenName: citizenName || "Anonymous",
      citizenPhone,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "complaints"), complaintData);

    return NextResponse.json({
      success: true,
      complaintId,
      docId: docRef.id,
      message: `Complaint ${complaintId} has been registered successfully.`,
    });
  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { error: "Failed to register complaint. Please try again." },
      { status: 500 }
    );
  }
}

// GET - Fetch complaints for a user by phone number
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const complaintsRef = collection(db, "complaints");
    const q = query(
      complaintsRef,
      where("citizenPhone", "==", phone),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const complaints = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      complaints.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      });
    });

    return NextResponse.json({ complaints });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaints." },
      { status: 500 }
    );
  }
}
