import { useState } from "react";
import { useListChords, getListChordsQueryKey, useGetChord, getGetChordQueryKey } from "@workspace/api-client-react";
import { Mic, Volume2, Search, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LearnPage() {
  const [search, setSearch] = useState("");
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  
  const { data: chords, isLoading } = useListChords({});
  const { data: chordDetail, isLoading: isLoadingDetail } = useGetChord(selectedChord || "", {
    query: { enabled: !!selectedChord, queryKey: getGetChordQueryKey(selectedChord || "") }
  });

  return (
    <div className="p-6 md:p-10 h-full flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
      
      {/* Left: Chord Dictionary */}
      <div className="w-full lg:w-1/3 flex flex-col h-full min-h-[400px]">
        <h1 className="text-3xl font-bold mb-2">Learn</h1>
        <p className="text-muted-foreground mb-6">Master chords and track progress.</p>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search chords..." 
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 gap-3 pb-20 lg:pb-0">
          {isLoading ? (
            [...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : (
            chords?.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map((chord) => (
              <button
                key={chord.id}
                onClick={() => setSelectedChord(chord.name)}
                className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  selectedChord === chord.name 
                    ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_-5px_var(--color-primary)]' 
                    : 'bg-card border-card-border hover:border-primary/50'
                }`}
              >
                <span className="font-bold text-xl">{chord.name}</span>
                <span className="text-xs text-muted-foreground uppercase">{chord.instrument}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Practice Area */}
      <div className="flex-1 flex flex-col bg-card border border-card-border rounded-2xl overflow-hidden min-h-[500px]">
        {selectedChord ? (
          isLoadingDetail ? (
            <div className="p-8 flex flex-col gap-8 h-full">
              <Skeleton className="h-12 w-48" />
              <div className="flex-1 flex items-center justify-center">
                <Skeleton className="w-64 h-64 rounded-xl" />
              </div>
            </div>
          ) : chordDetail ? (
            <div className="p-8 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-5xl font-black text-primary mb-2">{chordDetail.name}</h2>
                  <p className="text-muted-foreground">{chordDetail.description || "Master this chord to unlock new songs."}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  chordDetail.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                  chordDetail.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {chordDetail.difficulty}
                </div>
              </div>

              {/* Fret Diagram Mock */}
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="relative w-64 h-80 bg-background border border-border rounded-xl flex flex-col justify-between p-4 pb-8">
                  {/* Nut */}
                  <div className="w-full h-2 bg-foreground rounded-sm" />
                  {/* Frets */}
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-full h-px bg-border absolute" style={{ top: `${(i+1)*20}%` }} />
                  ))}
                  {/* Strings */}
                  <div className="absolute inset-x-4 inset-y-6 flex justify-between z-10">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-0.5 h-full bg-border" />
                    ))}
                  </div>
                  {/* Fingers */}
                  {chordDetail.fingers.map((fret, i) => fret > 0 && (
                    <div 
                      key={i} 
                      className="absolute w-6 h-6 rounded-full bg-primary z-20 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs font-bold text-primary-foreground"
                      style={{ left: `calc(1rem + ${i * 20}%)`, top: `calc(${fret * 20}% - 10%)` }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <Button variant="secondary" className="h-16 text-lg gap-2">
                  <Volume2 className="w-5 h-5" /> Listen
                </Button>
                <Button className="h-16 text-lg gap-2 bg-primary text-primary-foreground shadow-[0_0_20px_-5px_var(--color-primary)]">
                  <Mic className="w-5 h-5" /> Practice
                </Button>
              </div>
            </div>
          ) : null
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <Trophy className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-foreground mb-2">Select a chord to practice</h3>
            <p>Pick from the dictionary on the left to see diagrams, hear the sound, and test your skills using your microphone.</p>
          </div>
        )}
      </div>

    </div>
  );
}
