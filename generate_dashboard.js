const fs = require('fs');
const path = require('path');

const write = (p, content) => {
  const fullPath = path.join(__dirname, p);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
};

write('src/app/api/upload/route.ts', `
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
`);

write('src/app/dashboard/page.tsx', `
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

export default function Dashboard() {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sounds, setSounds] = useState<any[]>([]);

  const loadMySounds = () => {
    fetch('/api/sounds')
      .then(res => res.json())
      .then(data => {
        setSounds(data.filter((s: any) => s.user.name === session?.user?.name));
      });
  };

  useEffect(() => {
    if (session) loadMySounds();
  }, [session]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please select an audio file");
    
    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        // Upload to cloudinary via our API
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: reader.result })
        });
        
        if (!uploadRes.ok) throw new Error("Upload failed");
        const { url, publicId } = await uploadRes.json();

        // Save to DB
        const saveRes = await fetch("/api/sounds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, url, publicId })
        });

        if (!saveRes.ok) throw new Error("Save to DB failed");

        toast.success("Sound uploaded successfully");
        setTitle("");
        setDescription("");
        setFile(null);
        loadMySounds();
      } catch (err: any) {
        toast.error(err.message || "Failed to upload");
      } finally {
        setUploading(false);
      }
    };
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(\`/api/sounds/\${id}\`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Sound deleted");
      loadMySounds();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  if (!session) return <div className="text-center mt-20 text-slate-400">Please login to access the dashboard.</div>;

  return (
    <div className="grid md:grid-cols-2 gap-8 py-8">
      <div>
        <h2 className="text-3xl font-bold mb-6">Upload Sound Effect</h2>
        <form onSubmit={handleUpload} className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:outline-none focus:border-blue-500 transition" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-400 mb-1">Description (Optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:outline-none focus:border-blue-500 transition"></textarea>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-400 mb-1">Audio File</label>
            <input type="file" accept="audio/*" onChange={e => setFile(e.target.files?.[0] || null)} required className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          <button type="submit" disabled={uploading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-md transition disabled:opacity-50">
            {uploading ? "Uploading..." : "Upload Sound"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-6">My Sounds</h2>
        <div className="space-y-4">
          {sounds.map(sound => (
            <div key={sound.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center group hover:border-slate-500 transition">
              <div>
                <h4 className="font-semibold text-lg">{sound.title}</h4>
                <p className="text-sm text-slate-400 truncate max-w-[200px]">{sound.description}</p>
              </div>
              <button onClick={() => handleDelete(sound.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-full transition">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {sounds.length === 0 && <div className="text-slate-400">You haven't uploaded any sounds yet.</div>}
        </div>
      </div>
    </div>
  );
}
`);

console.log('Dashboard and Upload API generated.');
