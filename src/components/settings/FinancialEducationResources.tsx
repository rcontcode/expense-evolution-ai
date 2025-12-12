import { useState, useEffect } from 'react';
import { Book, Film, Tv, Headphones, Mic, Video, ExternalLink, Play, Star, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface Resource {
  title: string;
  author?: string;
  description: string;
  link: string;
  platform: string;
  language: 'es' | 'en';
}

const BOOKS: Resource[] = [
  {
    title: "Padre Rico, Padre Pobre",
    author: "Robert Kiyosaki",
    description: "El clásico que enseña la diferencia entre activos y pasivos, y cómo pensar como los ricos.",
    link: "https://www.amazon.com/Padre-Rico-Pobre-Spanish-dp-1644732769/dp/1644732769",
    platform: "Amazon",
    language: 'es'
  },
  {
    title: "El Hombre Más Rico de Babilonia",
    author: "George S. Clason",
    description: "Principios atemporales de ahorro e inversión a través de parábolas de la antigua Babilonia.",
    link: "https://www.amazon.com/hombre-m%C3%A1s-rico-Babilonia-Spanish/dp/607070230X",
    platform: "Amazon",
    language: 'es'
  },
  {
    title: "El Inversor Inteligente",
    author: "Benjamin Graham",
    description: "La biblia de la inversión en valor, recomendado por Warren Buffett.",
    link: "https://www.amazon.com/inversor-inteligente-Spanish-Benjamin-Graham/dp/0063356724",
    platform: "Amazon",
    language: 'es'
  },
  {
    title: "Piense y Hágase Rico",
    author: "Napoleon Hill",
    description: "Los 13 principios del éxito financiero basados en entrevistas con millonarios.",
    link: "https://www.amazon.com/Piense-h%C3%A1gase-rico-Spanish-Napoleon/dp/1640951741",
    platform: "Amazon",
    language: 'es'
  },
  {
    title: "Los Secretos de la Mente Millonaria",
    author: "T. Harv Eker",
    description: "Cómo dominar el juego interior de la riqueza y cambiar tu programación financiera.",
    link: "https://www.amazon.com/secretos-mente-millonaria-Spanish-Harv/dp/8478086080",
    platform: "Amazon",
    language: 'es'
  },
  {
    title: "The Psychology of Money",
    author: "Morgan Housel",
    description: "Lecciones atemporales sobre riqueza, codicia y felicidad.",
    link: "https://www.amazon.com/Psychology-Money-Timeless-lessons-happiness/dp/0857197681",
    platform: "Amazon",
    language: 'en'
  }
];

const DOCUMENTARIES: Resource[] = [
  {
    title: "Inside Job",
    author: "Charles Ferguson",
    description: "Documental ganador del Oscar sobre la crisis financiera de 2008.",
    link: "https://www.youtube.com/watch?v=T2IaJwkqgPk",
    platform: "YouTube",
    language: 'en'
  },
  {
    title: "Becoming Warren Buffett",
    author: "HBO",
    description: "La vida y filosofía de inversión del Oráculo de Omaha.",
    link: "https://www.youtube.com/watch?v=PB5krSvFAPY",
    platform: "YouTube",
    language: 'en'
  },
  {
    title: "The Ascent of Money",
    author: "Niall Ferguson",
    description: "Historia del dinero y los sistemas financieros desde sus orígenes.",
    link: "https://www.youtube.com/watch?v=fsrtB5lp60s",
    platform: "YouTube",
    language: 'en'
  },
  {
    title: "Money, Explained",
    author: "Netflix/Vox",
    description: "Serie documental que explica tarjetas de crédito, préstamos, apuestas y más.",
    link: "https://www.netflix.com/title/81345769",
    platform: "Netflix",
    language: 'en'
  },
  {
    title: "Get Smart With Money",
    author: "Netflix",
    description: "Cuatro personas transforman sus finanzas con ayuda de expertos.",
    link: "https://www.netflix.com/title/81350691",
    platform: "Netflix",
    language: 'en'
  }
];

const MOVIES: Resource[] = [
  {
    title: "The Big Short",
    description: "La historia real de los inversores que predijeron la crisis de 2008.",
    link: "https://www.imdb.com/title/tt1596363/",
    platform: "IMDB",
    language: 'en'
  },
  {
    title: "The Wolf of Wall Street",
    description: "La ascensión y caída de Jordan Belfort en Wall Street.",
    link: "https://www.imdb.com/title/tt0993846/",
    platform: "IMDB",
    language: 'en'
  },
  {
    title: "Margin Call",
    description: "24 horas en un banco de inversión durante el inicio de la crisis financiera.",
    link: "https://www.imdb.com/title/tt1615147/",
    platform: "IMDB",
    language: 'en'
  },
  {
    title: "Too Big to Fail",
    description: "El colapso financiero de 2008 desde dentro del gobierno y Wall Street.",
    link: "https://www.imdb.com/title/tt1742683/",
    platform: "IMDB",
    language: 'en'
  },
  {
    title: "The Pursuit of Happyness",
    description: "Historia inspiradora de Chris Gardner y su camino de la pobreza al éxito.",
    link: "https://www.imdb.com/title/tt0454921/",
    platform: "IMDB",
    language: 'en'
  }
];

const SERIES: Resource[] = [
  {
    title: "Billions",
    description: "El mundo de los hedge funds y las guerras de poder financiero.",
    link: "https://www.imdb.com/title/tt4270492/",
    platform: "Paramount+",
    language: 'en'
  },
  {
    title: "Ozark",
    description: "Un asesor financiero se ve obligado a lavar dinero para un cartel.",
    link: "https://www.netflix.com/title/80117552",
    platform: "Netflix",
    language: 'en'
  },
  {
    title: "Succession",
    description: "Drama sobre una familia dueña de un conglomerado de medios global.",
    link: "https://www.imdb.com/title/tt7660850/",
    platform: "HBO Max",
    language: 'en'
  },
  {
    title: "Black Monday",
    description: "Comedia sobre el crash de Wall Street de 1987.",
    link: "https://www.imdb.com/title/tt7406334/",
    platform: "Showtime",
    language: 'en'
  }
];

const PODCASTS: Resource[] = [
  {
    title: "The Dave Ramsey Show",
    author: "Dave Ramsey",
    description: "Consejos prácticos para salir de deudas y construir riqueza.",
    link: "https://open.spotify.com/show/5AIeaHLxE5f2kGdOI6nojb",
    platform: "Spotify",
    language: 'en'
  },
  {
    title: "Planet Money",
    author: "NPR",
    description: "Historias fascinantes sobre economía y dinero explicadas de forma entretenida.",
    link: "https://open.spotify.com/show/4FYpq3lSeQMAhqNI81O0Cn",
    platform: "Spotify",
    language: 'en'
  },
  {
    title: "BiggerPockets Real Estate",
    author: "BiggerPockets",
    description: "El podcast #1 sobre inversión en bienes raíces.",
    link: "https://open.spotify.com/show/0FG5hXD1hRvlW3cpLKqMGE",
    platform: "Spotify",
    language: 'en'
  },
  {
    title: "The Investor's Podcast",
    author: "Preston Pysh & Stig Brodersen",
    description: "Análisis de inversiones siguiendo los principios de Warren Buffett.",
    link: "https://open.spotify.com/show/28RHOkXkuHuotUrkCdvlOP",
    platform: "Spotify",
    language: 'en'
  },
  {
    title: "Finanzas Personales con Juan Haro",
    author: "Juan Haro",
    description: "Educación financiera en español para Latinoamérica.",
    link: "https://open.spotify.com/show/5u9RrMR7Pc7P4kXD7KKxDa",
    platform: "Spotify",
    language: 'es'
  },
  {
    title: "Cracks Podcast",
    author: "Oso Trava",
    description: "Entrevistas con emprendedores y empresarios exitosos de habla hispana.",
    link: "https://open.spotify.com/show/1a9v28nQJvJn8ITzZJbfDM",
    platform: "Spotify",
    language: 'es'
  }
];

const TED_TALKS: Resource[] = [
  {
    title: "How to Buy Happiness",
    author: "Michael Norton",
    description: "Investigación sobre cómo gastar dinero nos hace más felices.",
    link: "https://www.ted.com/talks/michael_norton_how_to_buy_happiness",
    platform: "TED",
    language: 'en'
  },
  {
    title: "The Psychology of Your Future Self",
    author: "Dan Gilbert",
    description: "Por qué subestimamos cuánto cambiaremos en el futuro.",
    link: "https://www.ted.com/talks/dan_gilbert_the_psychology_of_your_future_self",
    platform: "TED",
    language: 'en'
  },
  {
    title: "What Makes a Good Life?",
    author: "Robert Waldinger",
    description: "El estudio más largo sobre la felicidad revela qué nos hace felices.",
    link: "https://www.ted.com/talks/robert_waldinger_what_makes_a_good_life_lessons_from_the_longest_study_on_happiness",
    platform: "TED",
    language: 'en'
  },
  {
    title: "The Battle Between Your Present and Future Self",
    author: "Daniel Goldstein",
    description: "Herramientas para tomar mejores decisiones financieras a largo plazo.",
    link: "https://www.ted.com/talks/daniel_goldstein_the_battle_between_your_present_and_future_self",
    platform: "TED",
    language: 'en'
  },
  {
    title: "How to Make Stress Your Friend",
    author: "Kelly McGonigal",
    description: "Cómo cambiar tu relación con el estrés financiero.",
    link: "https://www.ted.com/talks/kelly_mcgonigal_how_to_make_stress_your_friend",
    platform: "TED",
    language: 'en'
  }
];

const YOUTUBE_CHANNELS: Resource[] = [
  {
    title: "Graham Stephan",
    description: "Inversiones, bienes raíces y finanzas personales explicadas de forma entretenida.",
    link: "https://www.youtube.com/@GrahamStephan",
    platform: "YouTube",
    language: 'en'
  },
  {
    title: "Andrei Jikh",
    description: "Inversiones, acciones, criptomonedas y FIRE explicados con visuales increíbles.",
    link: "https://www.youtube.com/@AndreiJikh",
    platform: "YouTube",
    language: 'en'
  },
  {
    title: "The Plain Bagel",
    description: "Conceptos financieros complejos explicados de forma simple y clara.",
    link: "https://www.youtube.com/@ThePlainBagel",
    platform: "YouTube",
    language: 'en'
  },
  {
    title: "Whiteboard Finance",
    description: "Educación financiera con explicaciones visuales en pizarra.",
    link: "https://www.youtube.com/@WhiteboardFinance",
    platform: "YouTube",
    language: 'en'
  },
  {
    title: "Kiyosaki en Español",
    author: "Robert Kiyosaki",
    description: "Canal oficial en español con lecciones sobre activos, pasivos e inversión.",
    link: "https://www.youtube.com/@RobertKiyosakiEspanol",
    platform: "YouTube",
    language: 'es'
  },
  {
    title: "Pequeño Cerdo Capitalista",
    author: "Sofía Macías",
    description: "Finanzas personales para principiantes en español.",
    link: "https://www.youtube.com/@PequenoCerdoCapitalista",
    platform: "YouTube",
    language: 'es'
  }
];

const ALL_RESOURCES = [...BOOKS, ...DOCUMENTARIES, ...MOVIES, ...SERIES, ...PODCASTS, ...TED_TALKS, ...YOUTUBE_CHANNELS];

const getPlatformColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'spotify': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'youtube': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'netflix': return 'bg-red-600/10 text-red-500 border-red-600/20';
    case 'ted': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'amazon': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'imdb': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    default: return 'bg-primary/10 text-primary border-primary/20';
  }
};

const getResourceKey = (resource: Resource) => `${resource.title}-${resource.link}`;

const ResourceCard = ({ 
  resource, 
  isFavorite, 
  onToggleFavorite 
}: { 
  resource: Resource; 
  isFavorite: boolean;
  onToggleFavorite: (resource: Resource) => void;
}) => (
  <div className="flex items-start gap-2 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
    <a
      href={resource.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 min-w-0"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
          {resource.title}
        </h4>
        <Badge variant="outline" className={`text-xs ${getPlatformColor(resource.platform)}`}>
          {resource.platform}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {resource.language === 'es' ? '🇪🇸 ES' : '🇬🇧 EN'}
        </Badge>
      </div>
      {resource.author && (
        <p className="text-xs text-muted-foreground mt-0.5">{resource.author}</p>
      )}
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{resource.description}</p>
    </a>
    <div className="flex items-center gap-1 flex-shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.preventDefault();
          onToggleFavorite(resource);
        }}
      >
        <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
      </Button>
      <a href={resource.link} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </a>
    </div>
  </div>
);

const ResourceSection = ({ 
  resources, 
  favorites,
  onToggleFavorite,
  languageFilter
}: { 
  resources: Resource[]; 
  favorites: string[];
  onToggleFavorite: (resource: Resource) => void;
  languageFilter: 'all' | 'es' | 'en';
}) => {
  const filteredResources = resources.filter(r => 
    languageFilter === 'all' || r.language === languageFilter
  );

  if (filteredResources.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay recursos disponibles en este idioma
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {filteredResources.map((resource, index) => (
        <ResourceCard 
          key={index} 
          resource={resource} 
          isFavorite={favorites.includes(getResourceKey(resource))}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};

export function FinancialEducationResources() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [languageFilter, setLanguageFilter] = useState<'all' | 'es' | 'en'>('all');
  const [activeTab, setActiveTab] = useState('books');

  useEffect(() => {
    const saved = localStorage.getItem('financial-education-favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  const toggleFavorite = (resource: Resource) => {
    const key = getResourceKey(resource);
    const newFavorites = favorites.includes(key)
      ? favorites.filter(f => f !== key)
      : [...favorites, key];
    
    setFavorites(newFavorites);
    localStorage.setItem('financial-education-favorites', JSON.stringify(newFavorites));
  };

  const favoriteResources = ALL_RESOURCES.filter(r => 
    favorites.includes(getResourceKey(r)) &&
    (languageFilter === 'all' || r.language === languageFilter)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          Recursos de Educación Financiera
        </CardTitle>
        <CardDescription>
          Libros, documentales, películas, series, podcasts y canales para aprender sobre finanzas e inversiones
        </CardDescription>
        
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Idioma:</span>
          </div>
          <ToggleGroup 
            type="single" 
            value={languageFilter} 
            onValueChange={(value) => value && setLanguageFilter(value as 'all' | 'es' | 'en')}
          >
            <ToggleGroupItem value="all" size="sm">Todos</ToggleGroupItem>
            <ToggleGroupItem value="es" size="sm">🇪🇸 Español</ToggleGroupItem>
            <ToggleGroupItem value="en" size="sm">🇬🇧 English</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="favorites" className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3" />
              Favoritos
              {favorites.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {favorites.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-1 text-xs">
              <Book className="h-3 w-3" />
              Libros
            </TabsTrigger>
            <TabsTrigger value="documentaries" className="flex items-center gap-1 text-xs">
              <Film className="h-3 w-3" />
              Documentales
            </TabsTrigger>
            <TabsTrigger value="movies" className="flex items-center gap-1 text-xs">
              <Video className="h-3 w-3" />
              Películas
            </TabsTrigger>
            <TabsTrigger value="series" className="flex items-center gap-1 text-xs">
              <Tv className="h-3 w-3" />
              Series
            </TabsTrigger>
            <TabsTrigger value="podcasts" className="flex items-center gap-1 text-xs">
              <Headphones className="h-3 w-3" />
              Podcasts
            </TabsTrigger>
            <TabsTrigger value="ted" className="flex items-center gap-1 text-xs">
              <Mic className="h-3 w-3" />
              TED Talks
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-1 text-xs">
              <Play className="h-3 w-3" />
              YouTube
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-[400px] overflow-y-auto pr-1">
            <TabsContent value="favorites" className="mt-0">
              {favoriteResources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No tienes favoritos guardados</p>
                  <p className="text-xs mt-1">Haz clic en la estrella ⭐ de cualquier recurso para agregarlo</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {favoriteResources.map((resource, index) => (
                    <ResourceCard 
                      key={index} 
                      resource={resource} 
                      isFavorite={true}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="books" className="mt-0">
              <ResourceSection 
                resources={BOOKS} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                languageFilter={languageFilter}
              />
            </TabsContent>
            <TabsContent value="documentaries" className="mt-0">
              <ResourceSection 
                resources={DOCUMENTARIES} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                languageFilter={languageFilter}
              />
            </TabsContent>
            <TabsContent value="movies" className="mt-0">
              <ResourceSection 
                resources={MOVIES} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                languageFilter={languageFilter}
              />
            </TabsContent>
            <TabsContent value="series" className="mt-0">
              <ResourceSection 
                resources={SERIES} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                languageFilter={languageFilter}
              />
            </TabsContent>
            <TabsContent value="podcasts" className="mt-0">
              <ResourceSection 
                resources={PODCASTS} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                languageFilter={languageFilter}
              />
            </TabsContent>
            <TabsContent value="ted" className="mt-0">
              <ResourceSection 
                resources={TED_TALKS} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                languageFilter={languageFilter}
              />
            </TabsContent>
            <TabsContent value="youtube" className="mt-0">
              <ResourceSection 
                resources={YOUTUBE_CHANNELS} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                languageFilter={languageFilter}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
