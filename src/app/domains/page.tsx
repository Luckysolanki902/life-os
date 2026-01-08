import Link from 'next/link';
import { Heart, BookOpen, Library } from 'lucide-react';

export default function DomainsPage() {
  const domains = [
    { 
      id: 'health', 
      name: 'Health', 
      description: 'Optimize your physical vessel.',
      icon: Heart, 
      color: 'text-rose-500', 
      bg: 'bg-rose-500/10' 
    },
    { 
      id: 'learning', 
      name: 'Learning', 
      description: 'Expand your knowledge base.',
      icon: BookOpen, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10' 
    },
    { 
      id: 'books', 
      name: 'Books', 
      description: 'Track your reading journey.',
      icon: Library, 
      color: 'text-cyan-500', 
      bg: 'bg-cyan-500/10' 
    },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Domains</h1>
        <p className="text-muted-foreground">Manage specific areas of your life.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {domains.map((domain) => {
          const Icon = domain.icon;
          return (
            <Link
              key={domain.id}
              href={`/${domain.id}`}
              className="group relative p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${domain.color}`}>
                <Icon size={120} />
              </div>

              <div className="relative space-y-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${domain.bg} ${domain.color}`}>
                  <Icon size={32} />
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-2xl">{domain.name}</h3>
                  <p className="text-muted-foreground">{domain.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
