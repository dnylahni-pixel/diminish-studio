import { Link } from "wouter";
import { motion } from "framer-motion";
import { Music, Activity, PlaySquare, Upload, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRuntimeConfig } from "@/lib/runtime-config";

export function HomePage() {
  const { ui } = useRuntimeConfig();
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-12 lg:px-24">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Studio console" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-4xl pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Activity className="w-4 h-4" />
              <span>Pro-grade chord analysis</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] text-foreground mb-6">
              Dissect music.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Play with precision.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              DiminishStudio sits at the intersection of a pro DAW and a music education app. Extract chords, sync lyrics, and mix layers of any song with cinematic clarity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={ui.homeCtaRedirect}>
                <Button size="lg" className="h-14 px-8 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shadow-[0_0_40px_-10px_var(--color-primary)] transition-all">
                  Start creating <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base font-bold border-white/10 hover:bg-white/5 w-full sm:w-auto">
                  Log in
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-background relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">The ultimate toolkit.</h2>
            <p className="text-muted-foreground text-lg">Designed for the serious musician's second monitor.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Upload,
                title: "Cinematic Processing",
                desc: "Upload any audio or drop a link. Watch as our engine extracts chords and syncs lyrics with a beautiful multi-stage visualization."
              },
              {
                icon: PlaySquare,
                title: "Deep Layer Mixing",
                desc: "Isolate what matters. Mix or mute guitar, piano, bass, drums, vocals, and synths independently while you practice."
              },
              {
                icon: Music,
                title: "Chord Timeline",
                desc: "A horizontal scrolling strip grouping chords by measure and beat, auto-synced to playback so you never lose your place."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-8 rounded-2xl bg-card border border-card-border hover:border-primary/50 transition-colors relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center mb-6 text-primary">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
