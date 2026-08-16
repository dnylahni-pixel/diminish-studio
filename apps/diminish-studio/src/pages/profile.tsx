import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { User, Music, Trophy, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePage() {
  const { data: user, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="bg-card border border-card-border rounded-3xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="w-32 h-32 rounded-full bg-muted border-4 border-background shadow-xl flex items-center justify-center overflow-hidden flex-shrink-0 relative z-10">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-muted-foreground/50" />
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left relative z-10">
          <h1 className="text-3xl font-black mb-2">{user?.username || "Musician"}</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            {user?.bio || "No bio added yet. Write something about your musical journey."}
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="bg-background border border-border px-4 py-2 rounded-lg flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Primary: {user?.preferredInstrument || "Guitar"}</span>
            </div>
            <div className="bg-background border border-border px-4 py-2 rounded-lg flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-sm">0 Mastered Chords</span>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-card-border rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> Recent Achievements
          </h3>
          <div className="text-center py-12 text-muted-foreground">
            No achievements yet. Start learning chords!
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" /> Library Stats
          </h3>
          <div className="text-center py-12 text-muted-foreground">
            Add songs to your library to see stats.
          </div>
        </div>
      </div>
    </div>
  );
}
