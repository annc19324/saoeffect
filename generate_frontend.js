const fs = require('fs');
const path = require('path');

const write = (p, content) => {
  const fullPath = path.join(__dirname, p);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
};

write('src/components/Provider.tsx', `
"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster position="bottom-right" />
      {children}
    </SessionProvider>
  );
}
`);

write('src/app/layout.tsx', `
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Provider from '@/components/Provider'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sao Effect',
  description: 'Download and listen to sound effects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-slate-900 text-white min-h-screen flex flex-col"}>
        <Provider>
          <Navbar />
          <main className="flex-grow max-w-7xl mx-auto w-full p-4">
            {children}
          </main>
        </Provider>
      </body>
    </html>
  )
}
`);

write('src/components/Navbar.tsx', `
"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-slate-800 p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Sao Effect
        </Link>
        <div className="flex gap-4 items-center">
          {session ? (
            <>
              <Link href="/dashboard" className="hover:text-blue-400 transition">Dashboard</Link>
              <button onClick={() => signOut()} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-md hover:bg-red-500/20 transition">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-400 transition">Login</Link>
              <Link href="/register" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
`);

write('src/app/page.tsx', `
"use client";
import { useEffect, useState, useRef } from "react";
import { Play, Pause, Download } from "lucide-react";
import toast from "react-hot-toast";

type Sound = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  user: { name: string };
};

export default function Home() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/sounds')
      .then(res => res.json())
      .then(data => {
        setSounds(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load sounds");
        setLoading(false);
      });
  }, []);

  const togglePlay = (url: string) => {
    if (currentPlaying === url) {
      audioRef.current?.pause();
      setCurrentPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setCurrentPlaying(url);
      }
    }
  };

  const handleDownload = (url: string, title: string) => {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = \`\${title}.mp3\`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  };

  return (
    <div className="py-8">
      <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Discover Sound Effects</h1>
      <audio ref={audioRef} onEnded={() => setCurrentPlaying(null)} />
      
      {loading ? (
        <div className="text-center text-slate-400">Loading sounds...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sounds.map(sound => (
            <div key={sound.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500/50 transition duration-300 group">
              <h3 className="text-xl font-semibold mb-2">{sound.title}</h3>
              <p className="text-sm text-slate-400 mb-4">{sound.description}</p>
              <div className="text-xs text-slate-500 mb-4">By: {sound.user.name}</div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                <button 
                  onClick={() => togglePlay(sound.url)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 transition shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                >
                  {currentPlaying === sound.url ? <Pause className="text-white" /> : <Play className="text-white ml-1" />}
                </button>
                <button 
                  onClick={() => handleDownload(sound.url, sound.title)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 transition"
                >
                  <Download size={18} /> Download
                </button>
              </div>
            </div>
          ))}
          {sounds.length === 0 && <div className="col-span-full text-center text-slate-400">No sounds uploaded yet.</div>}
        </div>
      )}
    </div>
  );
}
`);

write('src/app/login/page.tsx', `
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      email, password, redirect: false
    });
    
    if (res?.error) {
      toast.error("Invalid credentials");
    } else {
      toast.success("Logged in successfully");
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl">
      <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:outline-none focus:border-blue-500 transition" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:outline-none focus:border-blue-500 transition" />
        </div>
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-md mt-4 transition shadow-[0_0_15px_rgba(59,130,246,0.4)]">Sign In</button>
      </form>
      <p className="mt-6 text-center text-slate-400 text-sm">
        Don't have an account? <Link href="/register" className="text-blue-400 hover:underline">Register</Link>
      </p>
    </div>
  );
}
`);

write('src/app/register/page.tsx', `
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        toast.success("Registration successful! Please login.");
        router.push("/login");
      } else {
        toast.error("Registration failed.");
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl">
      <h2 className="text-3xl font-bold mb-6 text-center">Create Account</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:outline-none focus:border-blue-500 transition" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:outline-none focus:border-blue-500 transition" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:outline-none focus:border-blue-500 transition" />
        </div>
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-md mt-4 transition shadow-[0_0_15px_rgba(59,130,246,0.4)]">Sign Up</button>
      </form>
      <p className="mt-6 text-center text-slate-400 text-sm">
        Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Login</Link>
      </p>
    </div>
  );
}
`);

console.log('Frontend basic pages generated.');
