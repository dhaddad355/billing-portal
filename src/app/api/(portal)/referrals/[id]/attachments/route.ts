import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface ExtendedSession {
  user: {
    id: string;
    azureOid: string;
    name?: string | null;
    email?: string | null;
  };
}

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// GET /api/app/referrals/[id]/attachments - Get all attachments for a referral
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("referral_attachments")
      .select(`
        *,
        users (id, display_name, email)
      `)
      .eq("referral_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching referral attachments:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ attachments: data });
  } catch (error) {
    console.error("Error in referral attachments GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/app/referrals/[id]/attachments - Upload a file attachment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceClient();
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    const { id } = await params;

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed types: PDF, DOCX, DOC, JPEG, JPG, PNG, GIF" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `referrals/${id}/${timestamp}_${sanitizedFileName}`;

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("referral-attachments")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Save attachment metadata to database
    const { data, error } = await supabase
      .from("referral_attachments")
      .insert({
        referral_id: id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        uploaded_by: session?.user?.id || null,
      })
      .select(`
        *,
        users (id, display_name, email)
      `)
      .single();

    if (error) {
      console.error("Error saving attachment metadata:", error);
      // Try to delete the uploaded file
      await supabase.storage.from("referral-attachments").remove([storagePath]);
      return NextResponse.json({ error: "Failed to save attachment" }, { status: 500 });
    }

    return NextResponse.json({ attachment: data }, { status: 201 });
  } catch (error) {
    console.error("Error in referral attachments POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
