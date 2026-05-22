
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
  try {
    const sounds = await prisma.sound.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(sounds);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { title, description, url, publicId } = body;

    if (!title || !url || !publicId) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) return new NextResponse("Unauthorized", { status: 401 });

    const sound = await prisma.sound.create({
      data: {
        title,
        description,
        url,
        publicId,
        userId: currentUser.id
      }
    });

    return NextResponse.json(sound);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
