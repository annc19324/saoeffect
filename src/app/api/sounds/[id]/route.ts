
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import cloudinary from "@/lib/cloudinary";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) return new NextResponse("Unauthorized", { status: 401 });

    const sound = await prisma.sound.findUnique({
      where: { id: params.id }
    });

    if (!sound) return new NextResponse("Not Found", { status: 404 });

    if (sound.userId !== currentUser.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete from cloudinary
    if (sound.publicId) {
      await cloudinary.uploader.destroy(sound.publicId, { resource_type: 'video' });
    }

    await prisma.sound.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
