
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
        link.download = `${title}.mp3`;
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
