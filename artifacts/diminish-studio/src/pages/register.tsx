import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Music, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRegisterUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegisterUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "Account created successfully" });
          setLocation("/library");
        },
        onError: () => {
          toast({ title: "Registration failed", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary)_0%,transparent_50%)] opacity-5 pointer-events-none" />
      
      <div className="max-w-md w-full mx-auto p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card border border-card-border p-8 rounded-2xl shadow-xl"
        >
          <div className="flex justify-center mb-8">
            <div className="bg-primary/10 p-3 rounded-xl text-primary">
              <Music className="w-8 h-8" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2">Create an account</h2>
          <p className="text-muted-foreground text-center mb-8">Join the studio to start learning</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 text-base mt-2" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign up"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
