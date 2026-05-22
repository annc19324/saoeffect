
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { file } = await request.json();
    if (!file) {
      return new NextResponse("File missing", { status: 400 });
    }

    const uploadResponse = await cloudinary.uploader.upload(file, {
      resource_type: "video", // Cloudinary uses video for audio files
      folder: "sao_effect_sounds"
    });

    return NextResponse.json({
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
