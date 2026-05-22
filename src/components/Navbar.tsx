
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
