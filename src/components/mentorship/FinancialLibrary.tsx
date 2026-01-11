import { useState, useEffect, useMemo } from 'react';
import { Book, Film, Tv, Headphones, Mic, Video, ExternalLink, Star, Filter, Search, BookOpen, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';

interface Resource {
  title: string;
  author?: string;
  description: string;
  descriptionEn?: string;
  link: string;
  platform: string;
  language: 'es' | 'en' | 'both';
  category?: string;
}

// ==================== BOOKS ====================
const BOOKS: Resource[] = [
  // ========== ROBERT KIYOSAKI ==========
  { title: "Padre Rico, Padre Pobre", author: "Robert Kiyosaki", description: "El clásico que enseña la diferencia entre activos y pasivos, y cómo pensar como los ricos.", link: "https://www.amazon.com/dp/1644732769", platform: "Amazon", language: 'es', category: 'mindset' },
  { title: "El Cuadrante del Flujo de Dinero", author: "Robert Kiyosaki", description: "Descubre en qué cuadrante estás (E, S, B, I) y cómo moverte hacia la libertad financiera.", link: "https://www.amazon.com/dp/1945540362", platform: "Amazon", language: 'es', category: 'mindset' },
  { title: "Guía para Invertir", author: "Robert Kiyosaki", description: "Aprende en qué invierten los ricos y cómo reducir el riesgo de las inversiones.", link: "https://www.amazon.com/dp/1644732319", platform: "Amazon", language: 'es', category: 'investing' },
  { title: "Retírate Joven y Rico", author: "Robert Kiyosaki", description: "Cómo volverse rico rápidamente usando el apalancamiento.", link: "https://www.amazon.com/dp/6071134943", platform: "Amazon", language: 'es', category: 'fire' },
  { title: "La Ventaja del Ganador", author: "Robert Kiyosaki", description: "El poder de la educación financiera para salir adelante en tiempos de crisis.", link: "https://www.amazon.com/dp/6073114206", platform: "Amazon", language: 'es', category: 'mindset' },
  { title: "Segunda Oportunidad", author: "Robert Kiyosaki", description: "Prepárate para el mayor colapso económico de la historia y aprovéchalo.", link: "https://www.amazon.com/dp/6073133510", platform: "Amazon", language: 'es', category: 'investing' },
  { title: "Por Qué los Ricos se Vuelven Más Ricos", author: "Robert Kiyosaki", description: "La educación financiera real sobre cómo funcionan realmente el dinero y los impuestos.", link: "https://www.amazon.com/dp/1945540826", platform: "Amazon", language: 'es', category: 'wealth' },
  { title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", description: "The classic book teaching the difference between assets and liabilities.", link: "https://www.amazon.com/dp/1612681131", platform: "Amazon", language: 'en', category: 'mindset' },
  { title: "Cashflow Quadrant", author: "Robert Kiyosaki", description: "The guide to achieving financial freedom by moving from E and S to B and I.", link: "https://www.amazon.com/dp/1612680054", platform: "Amazon", language: 'en', category: 'wealth' },
  { title: "Rich Dad's Guide to Investing", author: "Robert Kiyosaki", description: "What the rich invest in, that the poor and middle class do not.", link: "https://www.amazon.com/dp/1612680216", platform: "Amazon", language: 'en', category: 'investing' },

  // ========== JAMES CLEAR ==========
  { title: "Hábitos Atómicos", author: "James Clear", description: "Pequeños cambios producen resultados extraordinarios. El 1% diario te hace 37x mejor en un año.", link: "https://www.amazon.com/dp/6075690840", platform: "Amazon", language: 'es', category: 'habits' },
  { title: "Atomic Habits", author: "James Clear", description: "Tiny changes, remarkable results for building wealth habits.", link: "https://www.amazon.com/dp/0735211299", platform: "Amazon", language: 'en', category: 'habits' },

  // ========== BRIAN TRACY ==========
  { title: "Las 21 Leyes del Liderazgo en Ventas", author: "Brian Tracy", description: "Sigue estas leyes y la gente te seguirá. Principios probados de liderazgo efectivo.", link: "https://www.amazon.com/dp/1602555680", platform: "Amazon", language: 'es', category: 'business' },
  { title: "Metas", author: "Brian Tracy", description: "Cómo obtener todo lo que quieres más rápido de lo que jamás pensaste posible.", link: "https://www.amazon.com/dp/8417963979", platform: "Amazon", language: 'es', category: 'mindset' },
  { title: "Psicología de Ventas", author: "Brian Tracy", description: "Cómo vender más, más fácil y rápidamente de lo que alguna vez pensaste posible.", link: "https://www.amazon.com/dp/1602551146", platform: "Amazon", language: 'es', category: 'business' },
  { title: "¡Tráguese Ese Sapo!", author: "Brian Tracy", description: "21 estrategias para tomar decisiones rápidas y mejorar la eficacia personal.", link: "https://www.amazon.com/dp/8492921862", platform: "Amazon", language: 'es', category: 'habits' },
  { title: "El Camino Hacia la Riqueza", author: "Brian Tracy", description: "La guía definitiva para hacer fortuna.", link: "https://www.amazon.com/dp/0814472958", platform: "Amazon", language: 'es', category: 'wealth' },
  { title: "Goals!", author: "Brian Tracy", description: "How to get everything you want faster than you ever thought possible.", link: "https://www.amazon.com/dp/1626566554", platform: "Amazon", language: 'en', category: 'mindset' },
  { title: "Eat That Frog!", author: "Brian Tracy", description: "21 great ways to stop procrastinating and get more done in less time.", link: "https://www.amazon.com/dp/162656941X", platform: "Amazon", language: 'en', category: 'habits' },
  { title: "The Psychology of Selling", author: "Brian Tracy", description: "Increase your sales faster and easier than you ever thought possible.", link: "https://www.amazon.com/dp/0785288066", platform: "Amazon", language: 'en', category: 'business' },
  { title: "Maximum Achievement", author: "Brian Tracy", description: "Strategies and skills that will unlock your hidden powers to succeed.", link: "https://www.amazon.com/dp/0684803313", platform: "Amazon", language: 'en', category: 'mindset' },
  { title: "No Excuses!", author: "Brian Tracy", description: "The power of self-discipline for success in your life.", link: "https://www.amazon.com/dp/1593156324", platform: "Amazon", language: 'en', category: 'habits' },

  // ========== JIM ROHN ==========
  { title: "Las 7 Estrategias para la Riqueza y la Felicidad", author: "Jim Rohn", description: "Lecciones poderosas de orientación personal para conseguir lo que deseas.", link: "https://www.amazon.com/dp/8496627438", platform: "Amazon", language: 'es', category: 'wealth' },
  { title: "El Arte de la Vida Excepcional", author: "Jim Rohn", description: "Principios probados para vivir una vida extraordinaria.", link: "https://www.amazon.com/dp/8417963456", platform: "Amazon", language: 'es', category: 'mindset' },
  { title: "Cinco Piezas Principales del Rompecabezas de la Vida", author: "Jim Rohn", description: "Filosofía, actitud, actividad, resultados y estilo de vida.", link: "https://www.amazon.com/dp/0939490005", platform: "Amazon", language: 'es', category: 'mindset' },
  { title: "7 Strategies for Wealth & Happiness", author: "Jim Rohn", description: "Power ideas from America's foremost business philosopher.", link: "https://www.amazon.com/dp/0761506160", platform: "Amazon", language: 'en', category: 'wealth' },
  { title: "The Art of Exceptional Living", author: "Jim Rohn", description: "Proven principles for living a life of purpose and significance.", link: "https://www.amazon.com/dp/0743220285", platform: "Amazon", language: 'en', category: 'mindset' },
  { title: "Leading an Inspired Life", author: "Jim Rohn", description: "The ultimate guide to personal development and success.", link: "https://www.amazon.com/dp/1555252540", platform: "Amazon", language: 'en', category: 'mindset' },
  { title: "The Five Major Pieces to the Life Puzzle", author: "Jim Rohn", description: "Philosophy, Attitude, Activity, Results, Lifestyle - the building blocks of success.", link: "https://www.amazon.com/dp/0939490021", platform: "Amazon", language: 'en', category: 'mindset' },
  { title: "My Philosophy for Successful Living", author: "Jim Rohn", description: "Essential principles for achieving success and happiness.", link: "https://www.amazon.com/dp/0991363469", platform: "Amazon", language: 'en', category: 'mindset' },
  { title: "Seasons of Life", author: "Jim Rohn", description: "Learning to embrace life's cycles for growth and prosperity.", link: "https://www.amazon.com/dp/0939490021", platform: "Amazon", language: 'en', category: 'mindset' },
  { title: "The Treasury of Quotes", author: "Jim Rohn", description: "A collection of timeless wisdom on success, leadership, and personal growth.", link: "https://www.amazon.com/dp/0939490048", platform: "Amazon", language: 'en', category: 'mindset' },

  // ========== OTHER CLASSICS ==========
  { title: "El Hombre Más Rico de Babilonia", author: "George S. Clason", description: "Principios atemporales de ahorro e inversión a través de parábolas de la antigua Babilonia.", link: "https://www.amazon.com/dp/607070230X", platform: "Amazon", language: 'es', category: 'basics' },
  { title: "El Inversor Inteligente", author: "Benjamin Graham", description: "La biblia de la inversión en valor, recomendado por Warren Buffett.", link: "https://www.amazon.com/dp/0063356724", platform: "Amazon", language: 'es', category: 'investing' },
  { title: "Piense y Hágase Rico", author: "Napoleon Hill", description: "Los 13 principios del éxito financiero basados en entrevistas con millonarios.", link: "https://www.amazon.com/dp/1640951741", platform: "Amazon", language: 'es', category: 'mindset' },
  { title: "Los Secretos de la Mente Millonaria", author: "T. Harv Eker", description: "Cómo dominar el juego interior de la riqueza y cambiar tu programación financiera.", link: "https://www.amazon.com/dp/8478086080", platform: "Amazon", language: 'es', category: 'mindset' },
  { title: "Pequeño Cerdo Capitalista", author: "Sofía Macías", description: "Finanzas personales explicadas de forma divertida para principiantes en Latinoamérica.", link: "https://www.amazon.com/dp/6073152795", platform: "Amazon", language: 'es', category: 'basics' },
  { title: "La Bolsa o la Vida", author: "Vicki Robin", description: "Cómo transformar tu relación con el dinero y lograr independencia financiera.", link: "https://www.amazon.com/dp/8417963324", platform: "Amazon", language: 'es', category: 'fire' },
  { title: "Finanzas Personales para Dummies", author: "Vicente Hernández", description: "Guía completa de finanzas personales explicada de forma sencilla.", link: "https://www.amazon.com/dp/8432904333", platform: "Amazon", language: 'es', category: 'basics' },
  { title: "El Millonario de al Lado", author: "Thomas J. Stanley", description: "Estudio sobre cómo viven realmente los millonarios estadounidenses.", link: "https://www.amazon.com/dp/8417963073", platform: "Amazon", language: 'es', category: 'mindset' },
  { title: "Dinero: Domina el Juego", author: "Tony Robbins", description: "7 pasos simples hacia la libertad financiera basados en entrevistas con los mejores inversores.", link: "https://www.amazon.com/dp/6073138482", platform: "Amazon", language: 'es', category: 'investing' },
  { title: "El Código del Dinero", author: "Raimon Samsó", description: "Cómo convertir tu pasión en profesión y crear múltiples fuentes de ingresos.", link: "https://www.amazon.com/dp/8497778480", platform: "Amazon", language: 'es', category: 'entrepreneurship' },
  { title: "Independízate de Papá Estado", author: "Carlos Galán", description: "Guía para lograr la libertad financiera invirtiendo en fondos indexados.", link: "https://www.amazon.com/dp/8494834967", platform: "Amazon", language: 'es', category: 'fire' },
  { title: "Un Paso por Delante de Wall Street", author: "Peter Lynch", description: "Cómo invertir en la bolsa usando el sentido común.", link: "https://www.amazon.com/dp/8423427668", platform: "Amazon", language: 'es', category: 'investing' },
  { title: "Cómo Piensan los Ricos", author: "Morgan Housel", description: "18 lecciones sobre la psicología del dinero y la inversión.", link: "https://www.amazon.com/dp/8408241478", platform: "Amazon", language: 'es', category: 'mindset' },
  
  // English Books
  { title: "The Psychology of Money", author: "Morgan Housel", description: "Timeless lessons on wealth, greed, and happiness.", link: "https://www.amazon.com/dp/0857197681", platform: "Amazon", language: 'en', category: 'mindset' },
  { title: "The Intelligent Investor", author: "Benjamin Graham", description: "The definitive book on value investing, recommended by Warren Buffett.", link: "https://www.amazon.com/dp/0060555661", platform: "Amazon", language: 'en', category: 'investing' },
  { title: "A Random Walk Down Wall Street", author: "Burton Malkiel", description: "The time-tested strategy for successful investing.", link: "https://www.amazon.com/dp/1324002182", platform: "Amazon", language: 'en', category: 'investing' },
  { title: "The Simple Path to Wealth", author: "JL Collins", description: "Your road map to financial independence and a rich, free life.", link: "https://www.amazon.com/dp/1533667926", platform: "Amazon", language: 'en', category: 'fire' },
  { title: "I Will Teach You to Be Rich", author: "Ramit Sethi", description: "A 6-week program for automating your finances and spending guilt-free.", link: "https://www.amazon.com/dp/1523505745", platform: "Amazon", language: 'en', category: 'basics' },
  { title: "The Total Money Makeover", author: "Dave Ramsey", description: "A proven plan for financial fitness using the debt snowball method.", link: "https://www.amazon.com/dp/1595555277", platform: "Amazon", language: 'en', category: 'debt' },
  { title: "Your Money or Your Life", author: "Vicki Robin", description: "Transform your relationship with money and achieve financial independence.", link: "https://www.amazon.com/dp/0143115766", platform: "Amazon", language: 'en', category: 'fire' },
  { title: "The Millionaire Next Door", author: "Thomas J. Stanley", description: "Surprising secrets of America's wealthy.", link: "https://www.amazon.com/dp/1589795474", platform: "Amazon", language: 'en', category: 'mindset' },
  { title: "Think and Grow Rich", author: "Napoleon Hill", description: "The 13 principles of financial success from interviews with millionaires.", link: "https://www.amazon.com/dp/1585424331", platform: "Amazon", language: 'en', category: 'mindset' },
  { title: "The Little Book of Common Sense Investing", author: "John C. Bogle", description: "The only way to guarantee your fair share of stock market returns.", link: "https://www.amazon.com/dp/1119404509", platform: "Amazon", language: 'en', category: 'investing' },
  { title: "Die With Zero", author: "Bill Perkins", description: "Getting all you can from your money and your life.", link: "https://www.amazon.com/dp/0358099765", platform: "Amazon", language: 'en', category: 'fire' },
  { title: "The Bogleheads' Guide to Investing", author: "Taylor Larimore", description: "A DIY guide to investing using Vanguard's founder's philosophy.", link: "https://www.amazon.com/dp/1118921283", platform: "Amazon", language: 'en', category: 'investing' },
  { title: "The Richest Man in Babylon", author: "George S. Clason", description: "Ancient wisdom for modern wealth building.", link: "https://www.amazon.com/dp/1505339111", platform: "Amazon", language: 'en', category: 'basics' },
  { title: "The 4-Hour Workweek", author: "Tim Ferriss", description: "Escape 9-5, live anywhere, and join the new rich.", link: "https://www.amazon.com/dp/0307465357", platform: "Amazon", language: 'en', category: 'entrepreneurship' },
  { title: "The Millionaire Fastlane", author: "MJ DeMarco", description: "Crack the code to wealth and live rich for a lifetime.", link: "https://www.amazon.com/dp/0984358102", platform: "Amazon", language: 'en', category: 'entrepreneurship' },
  { title: "Set for Life", author: "Scott Trench", description: "Dominate life, money, and the American dream.", link: "https://www.amazon.com/dp/0997584718", platform: "Amazon", language: 'en', category: 'fire' },
  { title: "Secrets of the Millionaire Mind", author: "T. Harv Eker", description: "Mastering the inner game of wealth.", link: "https://www.amazon.com/dp/0060763280", platform: "Amazon", language: 'en', category: 'mindset' },
  { title: "The Automatic Millionaire", author: "David Bach", description: "A powerful one-step plan to live and finish rich.", link: "https://www.amazon.com/dp/0451499085", platform: "Amazon", language: 'en', category: 'basics' },
  { title: "Money: Master the Game", author: "Tony Robbins", description: "7 simple steps to financial freedom.", link: "https://www.amazon.com/dp/1476757860", platform: "Amazon", language: 'en', category: 'investing' },
  { title: "The Wealthy Barber", author: "David Chilton", description: "Everyone's commonsense guide to becoming financially independent.", link: "https://www.amazon.com/dp/0761513116", platform: "Amazon", language: 'en', category: 'basics' },
  { title: "One Up On Wall Street", author: "Peter Lynch", description: "How to use what you already know to make money in the market.", link: "https://www.amazon.com/dp/0743200403", platform: "Amazon", language: 'en', category: 'investing' },
  { title: "The Barefoot Investor", author: "Scott Pape", description: "The only money guide you'll ever need.", link: "https://www.amazon.com/dp/0730324214", platform: "Amazon", language: 'en', category: 'basics' },
  { title: "Early Retirement Extreme", author: "Jacob Lund Fisker", description: "A philosophical and practical guide to financial independence.", link: "https://www.amazon.com/dp/145360121X", platform: "Amazon", language: 'en', category: 'fire' },
  { title: "Quit Like a Millionaire", author: "Kristy Shen", description: "No gimmicks, luck, or trust fund required.", link: "https://www.amazon.com/dp/0525538690", platform: "Amazon", language: 'en', category: 'fire' },
  { title: "Financial Freedom", author: "Grant Sabatier", description: "A proven path to all the money you will ever need.", link: "https://www.amazon.com/dp/052553458X", platform: "Amazon", language: 'en', category: 'fire' },
  { title: "The Two-Income Trap", author: "Elizabeth Warren", description: "Why middle-class parents are going broke.", link: "https://www.amazon.com/dp/0465090907", platform: "Amazon", language: 'en', category: 'basics' },
];

// ==================== DOCUMENTARIES ====================
const DOCUMENTARIES: Resource[] = [
  // English Documentaries
  { title: "Inside Job", author: "Charles Ferguson", description: "Documental ganador del Oscar sobre la crisis financiera de 2008.", descriptionEn: "Oscar-winning documentary about the 2008 financial crisis.", link: "https://www.youtube.com/watch?v=T2IaJwkqgPk", platform: "YouTube", language: 'en', category: 'crisis' },
  { title: "Becoming Warren Buffett", author: "HBO", description: "La vida y filosofía de inversión del Oráculo de Omaha.", descriptionEn: "The life and investment philosophy of the Oracle of Omaha.", link: "https://www.youtube.com/watch?v=PB5krSvFAPY", platform: "YouTube", language: 'en', category: 'biography' },
  { title: "The Ascent of Money", author: "Niall Ferguson", description: "Historia del dinero y los sistemas financieros.", descriptionEn: "The history of money and financial systems.", link: "https://www.youtube.com/watch?v=fsrtB5lp60s", platform: "YouTube", language: 'en', category: 'history' },
  { title: "Money, Explained", author: "Netflix/Vox", description: "Serie sobre tarjetas de crédito, préstamos y más.", descriptionEn: "Series explaining credit cards, loans, and more.", link: "https://www.netflix.com/title/81345769", platform: "Netflix", language: 'en', category: 'basics' },
  { title: "Get Smart With Money", author: "Netflix", description: "Cuatro personas transforman sus finanzas con expertos.", descriptionEn: "Four people transform their finances with help from experts.", link: "https://www.netflix.com/title/81350691", platform: "Netflix", language: 'en', category: 'transformation' },
  { title: "Enron: The Smartest Guys in the Room", description: "El escándalo corporativo que cambió Wall Street.", descriptionEn: "The corporate scandal that changed Wall Street.", link: "https://www.youtube.com/watch?v=AiWKPQALVL0", platform: "YouTube", language: 'en', category: 'crisis' },
  { title: "Capitalism: A Love Story", author: "Michael Moore", description: "Crítica al sistema capitalista estadounidense.", descriptionEn: "A critique of the American capitalist system.", link: "https://www.imdb.com/title/tt1232207/", platform: "IMDB", language: 'en', category: 'politics' },
  { title: "The China Hustle", description: "El mayor fraude financiero del que nunca has oído.", descriptionEn: "The biggest financial fraud you've never heard of.", link: "https://www.youtube.com/watch?v=55892jT06aI", platform: "YouTube", language: 'en', category: 'fraud' },
  { title: "Playing With FIRE", description: "El movimiento FIRE explicado por quienes lo viven.", descriptionEn: "The FIRE movement explained by those living it.", link: "https://www.youtube.com/watch?v=RdWoaOFEpCk", platform: "YouTube", language: 'en', category: 'fire' },
  { title: "Moneyball", description: "Cómo los datos revolucionaron el béisbol y los negocios.", descriptionEn: "How data revolutionized baseball and business.", link: "https://www.imdb.com/title/tt1210166/", platform: "IMDB", language: 'en', category: 'data' },
  { title: "Generation Wealth", author: "Lauren Greenfield", description: "Exploración de la obsesión americana con la riqueza.", descriptionEn: "Exploration of America's obsession with wealth.", link: "https://www.youtube.com/watch?v=lHH1qJL0UNs", platform: "YouTube", language: 'en', category: 'culture' },
  { title: "Betting on Zero", description: "La batalla contra el esquema Ponzi de Herbalife.", descriptionEn: "The battle against Herbalife's alleged pyramid scheme.", link: "https://www.youtube.com/watch?v=KMW8nQIxGmk", platform: "YouTube", language: 'en', category: 'fraud' },
  
  // Spanish Documentaries
  { title: "El Dinero es Deuda", author: "Paul Grignon", description: "Documental animado que explica cómo se crea el dinero en el sistema bancario.", link: "https://www.youtube.com/watch?v=nHt2MaQxEhw", platform: "YouTube", language: 'es', category: 'basics' },
  { title: "La Corporación", description: "Análisis crítico del comportamiento de las grandes corporaciones.", link: "https://www.youtube.com/watch?v=Zx0f_8FKMrY", platform: "YouTube", language: 'es', category: 'politics' },
  { title: "Dinero Como Deuda II", author: "Paul Grignon", description: "Segunda parte que profundiza en la naturaleza del dinero.", link: "https://www.youtube.com/watch?v=mQUhJTxK5mA", platform: "YouTube", language: 'es', category: 'basics' },
  { title: "Zeitgeist: Addendum", description: "Documental sobre el sistema monetario y alternativas económicas.", link: "https://www.youtube.com/watch?v=EewGMBOB4Gg", platform: "YouTube", language: 'es', category: 'economics' },
  { title: "La Doctrina del Shock", author: "Naomi Klein", description: "Cómo se aprovechan las crisis para imponer políticas económicas.", link: "https://www.youtube.com/watch?v=7iW1SHPgUAk", platform: "YouTube", language: 'es', category: 'politics' },
  { title: "Catastroika", description: "Documental sobre las consecuencias de la privatización masiva.", link: "https://www.youtube.com/watch?v=1wm72oqsYqg", platform: "YouTube", language: 'es', category: 'economics' },
  { title: "97% Owned", description: "Cómo funciona realmente el sistema monetario (subtitulado).", link: "https://www.youtube.com/watch?v=XcGh1Dex4Yo", platform: "YouTube", language: 'es', category: 'basics' },
  { title: "Los Amos del Dinero", description: "Historia del control del sistema financiero mundial.", link: "https://www.youtube.com/watch?v=gD05pMC0JnQ", platform: "YouTube", language: 'es', category: 'history' },
  { title: "Prosperidad Sin Crecimiento", description: "Cuestionando el modelo económico basado en crecimiento infinito.", link: "https://www.youtube.com/watch?v=6qjj3m2aMGQ", platform: "YouTube", language: 'es', category: 'economics' },
  { title: "Las Claves de la Economía", author: "RTVE", description: "Serie documental española sobre conceptos económicos fundamentales.", link: "https://www.rtve.es/play/videos/las-claves-de-la-economia/", platform: "RTVE", language: 'es', category: 'basics' },
];

// ==================== MOVIES ====================
const MOVIES: Resource[] = [
  // English Movies
  { title: "The Big Short", description: "La historia real de quienes predijeron la crisis de 2008.", descriptionEn: "The true story of those who predicted the 2008 crisis.", link: "https://www.imdb.com/title/tt1596363/", platform: "IMDB", language: 'en', category: 'crisis' },
  { title: "The Wolf of Wall Street", description: "La ascensión y caída de Jordan Belfort.", descriptionEn: "The rise and fall of Jordan Belfort.", link: "https://www.imdb.com/title/tt0993846/", platform: "IMDB", language: 'en', category: 'wallstreet' },
  { title: "Margin Call", description: "24 horas en un banco durante el inicio de la crisis.", descriptionEn: "24 hours in a bank at the start of the financial crisis.", link: "https://www.imdb.com/title/tt1615147/", platform: "IMDB", language: 'en', category: 'crisis' },
  { title: "Too Big to Fail", description: "El colapso de 2008 desde Wall Street y el gobierno.", descriptionEn: "The 2008 collapse from Wall Street and government perspective.", link: "https://www.imdb.com/title/tt1742683/", platform: "IMDB", language: 'en', category: 'crisis' },
  { title: "The Pursuit of Happyness", description: "Historia inspiradora de Chris Gardner.", descriptionEn: "The inspiring story of Chris Gardner.", link: "https://www.imdb.com/title/tt0454921/", platform: "IMDB", language: 'en', category: 'inspiration' },
  { title: "Moneyball", description: "Cómo revolucionar un deporte con datos y análisis.", descriptionEn: "How to revolutionize a sport with data and analytics.", link: "https://www.imdb.com/title/tt1210166/", platform: "IMDB", language: 'en', category: 'strategy' },
  { title: "Wall Street (1987)", description: "Gordon Gekko y la codicia de los años 80.", descriptionEn: "Gordon Gekko and the greed of the 80s.", link: "https://www.imdb.com/title/tt0094291/", platform: "IMDB", language: 'en', category: 'wallstreet' },
  { title: "Trading Places", description: "Comedia clásica sobre el mundo de las inversiones.", descriptionEn: "Classic comedy about the world of investments.", link: "https://www.imdb.com/title/tt0086465/", platform: "IMDB", language: 'en', category: 'comedy' },
  { title: "The Social Network", description: "La historia de Facebook y el emprendimiento tech.", descriptionEn: "The story of Facebook and tech entrepreneurship.", link: "https://www.imdb.com/title/tt1285016/", platform: "IMDB", language: 'en', category: 'entrepreneurship' },
  { title: "Glengarry Glen Ross", description: "El lado oscuro de las ventas y el capitalismo.", descriptionEn: "The dark side of sales and capitalism.", link: "https://www.imdb.com/title/tt0104348/", platform: "IMDB", language: 'en', category: 'sales' },
  { title: "Boiler Room", description: "El mundo de los corredores de bolsa fraudulentos.", descriptionEn: "The world of fraudulent stockbrokers.", link: "https://www.imdb.com/title/tt0181984/", platform: "IMDB", language: 'en', category: 'fraud' },
  { title: "The Founder", description: "Cómo Ray Kroc construyó el imperio McDonald's.", descriptionEn: "How Ray Kroc built the McDonald's empire.", link: "https://www.imdb.com/title/tt4276820/", platform: "IMDB", language: 'en', category: 'entrepreneurship' },
  { title: "Joy", description: "La historia de Joy Mangano y su invento revolucionario.", descriptionEn: "Joy Mangano's story and her revolutionary invention.", link: "https://www.imdb.com/title/tt2446980/", platform: "IMDB", language: 'en', category: 'entrepreneurship' },
  { title: "Rogue Trader", description: "La historia real de Nick Leeson y el colapso de Barings Bank.", descriptionEn: "The true story of Nick Leeson and the Barings Bank collapse.", link: "https://www.imdb.com/title/tt0131566/", platform: "IMDB", language: 'en', category: 'fraud' },
  
  // Spanish/Latin Movies
  { title: "El Método", description: "Thriller psicológico español sobre un proceso de selección empresarial despiadado.", link: "https://www.imdb.com/title/tt0427582/", platform: "IMDB", language: 'es', category: 'business' },
  { title: "La Gran Apuesta (doblada)", description: "Versión en español del docudrama sobre la crisis de 2008.", link: "https://www.imdb.com/title/tt1596363/", platform: "IMDB", language: 'es', category: 'crisis' },
  { title: "Los Lunes al Sol", description: "Drama español sobre el desempleo y sus consecuencias económicas.", link: "https://www.imdb.com/title/tt0298476/", platform: "IMDB", language: 'es', category: 'unemployment' },
  { title: "El Capital", author: "Costa-Gavras", description: "Un banquero manipula para llegar a la cima del poder financiero.", link: "https://www.imdb.com/title/tt1895315/", platform: "IMDB", language: 'es', category: 'wallstreet' },
  { title: "La Ley del Mercado", description: "Drama francés sobre las dificultades de un desempleado buscando trabajo.", link: "https://www.imdb.com/title/tt4231638/", platform: "IMDB", language: 'es', category: 'unemployment' },
  { title: "Acorralada (Trapped)", description: "Una familia se enfrenta a la crisis económica en Islandia.", link: "https://www.imdb.com/title/tt4218248/", platform: "IMDB", language: 'es', category: 'crisis' },
  { title: "Vivir sin Permiso", description: "Serie/película sobre un empresario gallego y su imperio.", link: "https://www.imdb.com/title/tt8434626/", platform: "IMDB", language: 'es', category: 'entrepreneurship' },
  { title: "El Ciudadano Ilustre", description: "Un Nobel regresa a su pueblo natal y reflexiona sobre el éxito.", link: "https://www.imdb.com/title/tt5765844/", platform: "IMDB", language: 'es', category: 'success' },
  { title: "Toc Toc", description: "Comedia española con lecciones sobre los miedos que limitan nuestro potencial.", link: "https://www.imdb.com/title/tt5821748/", platform: "IMDB", language: 'es', category: 'psychology' },
  { title: "La Vida Padre", description: "Comedia sobre un padre que finge su muerte para cobrar el seguro.", link: "https://www.imdb.com/title/tt23783436/", platform: "IMDB", language: 'es', category: 'comedy' },
];

// ==================== SERIES ====================
const SERIES: Resource[] = [
  // English Series
  { title: "Billions", description: "El mundo de los hedge funds y guerras de poder.", descriptionEn: "The world of hedge funds and power wars.", link: "https://www.imdb.com/title/tt4270492/", platform: "Paramount+", language: 'en', category: 'wallstreet' },
  { title: "Ozark", description: "Un asesor financiero obligado a lavar dinero.", descriptionEn: "A financial advisor forced to launder money.", link: "https://www.netflix.com/title/80117552", platform: "Netflix", language: 'en', category: 'crime' },
  { title: "Succession", description: "Drama sobre una familia y su conglomerado global.", descriptionEn: "Drama about a family and their global conglomerate.", link: "https://www.imdb.com/title/tt7660850/", platform: "HBO Max", language: 'en', category: 'business' },
  { title: "Black Monday", description: "Comedia sobre el crash de Wall Street de 1987.", descriptionEn: "Comedy about the 1987 Wall Street crash.", link: "https://www.imdb.com/title/tt7406334/", platform: "Showtime", language: 'en', category: 'crisis' },
  { title: "Industry", description: "Jóvenes banqueros en un banco de inversión de Londres.", descriptionEn: "Young bankers at a London investment bank.", link: "https://www.imdb.com/title/tt11216348/", platform: "HBO Max", language: 'en', category: 'wallstreet' },
  { title: "Dirty Money", description: "Serie documental sobre corrupción corporativa.", descriptionEn: "Documentary series about corporate corruption.", link: "https://www.netflix.com/title/80118100", platform: "Netflix", language: 'en', category: 'corruption' },
  { title: "Bad Banks", description: "El mundo de la banca de inversión alemana.", descriptionEn: "The world of German investment banking.", link: "https://www.imdb.com/title/tt5795504/", platform: "Netflix", language: 'en', category: 'wallstreet' },
  { title: "Super Pumped: The Battle for Uber", description: "La historia de Travis Kalanick y Uber.", descriptionEn: "The story of Travis Kalanick and Uber.", link: "https://www.imdb.com/title/tt11177158/", platform: "Showtime", language: 'en', category: 'entrepreneurship' },
  { title: "WeCrashed", description: "El ascenso y caída de WeWork.", descriptionEn: "The rise and fall of WeWork.", link: "https://www.imdb.com/title/tt12005128/", platform: "Apple TV+", language: 'en', category: 'entrepreneurship' },
  { title: "The Dropout", description: "La historia de Elizabeth Holmes y Theranos.", descriptionEn: "The story of Elizabeth Holmes and Theranos.", link: "https://www.imdb.com/title/tt10166622/", platform: "Hulu", language: 'en', category: 'fraud' },
  { title: "Inventing Anna", description: "La estafadora que engañó a la élite de Nueva York.", descriptionEn: "The con artist who fooled New York's elite.", link: "https://www.netflix.com/title/81008305", platform: "Netflix", language: 'en', category: 'fraud' },
  
  // Spanish Series
  { title: "El Embarcadero", description: "Thriller español con temas de negocios y doble vida.", link: "https://www.imdb.com/title/tt7886276/", platform: "Movistar+", language: 'es', category: 'drama' },
  { title: "La Casa de Papel", description: "El atraco más grande de la historia con planificación financiera extrema.", link: "https://www.netflix.com/title/80192098", platform: "Netflix", language: 'es', category: 'heist' },
  { title: "Élite", description: "Drama adolescente español con conflictos de clases sociales.", link: "https://www.netflix.com/title/80200942", platform: "Netflix", language: 'es', category: 'drama' },
  { title: "Gran Hotel", description: "Intrigas y negocios en un hotel de lujo de principios del siglo XX.", link: "https://www.imdb.com/title/tt1820254/", platform: "Netflix", language: 'es', category: 'business' },
  { title: "Velvet", description: "Amor y negocios en las galerías de moda más importantes de Madrid.", link: "https://www.imdb.com/title/tt3582458/", platform: "Netflix", language: 'es', category: 'business' },
  { title: "Vivir sin Permiso", description: "Un empresario gallego construye un imperio desde la nada.", link: "https://www.imdb.com/title/tt8434626/", platform: "Netflix", language: 'es', category: 'entrepreneurship' },
  { title: "Nerón", description: "Serie sobre un empresario corrupto y su caída.", link: "https://www.imdb.com/title/tt14901002/", platform: "Movistar+", language: 'es', category: 'corruption' },
  { title: "El Inocente", description: "Thriller que explora las consecuencias de malas decisiones financieras.", link: "https://www.netflix.com/title/80244190", platform: "Netflix", language: 'es', category: 'drama' },
  { title: "Club de Cuervos", description: "Comedia mexicana sobre la gestión de un club de fútbol.", link: "https://www.netflix.com/title/80039195", platform: "Netflix", language: 'es', category: 'business' },
  { title: "Narcos: México", description: "El negocio ilícito más grande de la historia reciente.", link: "https://www.netflix.com/title/80106626", platform: "Netflix", language: 'es', category: 'crime' },
];

// ==================== PODCASTS ====================
const PODCASTS: Resource[] = [
  // English Podcasts
  { title: "The Dave Ramsey Show", author: "Dave Ramsey", description: "Consejos prácticos para salir de deudas.", descriptionEn: "Practical advice for getting out of debt.", link: "https://open.spotify.com/show/5AIeaHLxE5f2kGdOI6nojb", platform: "Spotify", language: 'en', category: 'debt' },
  { title: "Planet Money", author: "NPR", description: "Historias fascinantes sobre economía.", descriptionEn: "Fascinating stories about economics.", link: "https://open.spotify.com/show/4FYpq3lSeQMAhqNI81O0Cn", platform: "Spotify", language: 'en', category: 'economics' },
  { title: "BiggerPockets Real Estate", author: "BiggerPockets", description: "El podcast #1 sobre inversión inmobiliaria.", descriptionEn: "The #1 podcast on real estate investing.", link: "https://open.spotify.com/show/0FG5hXD1hRvlW3cpLKqMGE", platform: "Spotify", language: 'en', category: 'realestate' },
  { title: "The Investor's Podcast", author: "Preston Pysh", description: "Análisis de inversiones estilo Warren Buffett.", descriptionEn: "Investment analysis Warren Buffett style.", link: "https://open.spotify.com/show/28RHOkXkuHuotUrkCdvlOP", platform: "Spotify", language: 'en', category: 'investing' },
  { title: "ChooseFI", author: "ChooseFI", description: "El podcast de la comunidad FIRE.", descriptionEn: "The FIRE community podcast.", link: "https://open.spotify.com/show/1J8lPYu5oIqP7FKXXhXNMD", platform: "Spotify", language: 'en', category: 'fire' },
  { title: "Afford Anything", author: "Paula Pant", description: "Puedes permitirte cualquier cosa, pero no todo.", descriptionEn: "You can afford anything, but not everything.", link: "https://open.spotify.com/show/3PtkXPBq6AoZD5bNPZ0TKl", platform: "Spotify", language: 'en', category: 'fire' },
  { title: "The Money Guy Show", author: "Brian Preston", description: "Consejos financieros para cada etapa de vida.", descriptionEn: "Financial advice for every stage of life.", link: "https://open.spotify.com/show/4oLtMVZvjBMkEMwzCN5hME", platform: "Spotify", language: 'en', category: 'basics' },
  { title: "Rational Reminder", author: "Ben Felix", description: "Inversión basada en evidencia.", descriptionEn: "Evidence-based investing.", link: "https://open.spotify.com/show/3danPDdqB8fVKg3MaAqUqU", platform: "Spotify", language: 'en', category: 'investing' },
  { title: "The Financial Independence Podcast", author: "Mad Fientist", description: "Estrategias avanzadas para FIRE.", descriptionEn: "Advanced strategies for FIRE.", link: "https://open.spotify.com/show/0JZvwwXjfCBybWCg6JZwI9", platform: "Spotify", language: 'en', category: 'fire' },
  { title: "Motley Fool Money", author: "Motley Fool", description: "Análisis semanal del mercado de valores.", descriptionEn: "Weekly stock market analysis.", link: "https://open.spotify.com/show/3pEPYKqCFX0EeZm5e4H5vT", platform: "Spotify", language: 'en', category: 'investing' },
  
  // Spanish Podcasts
  { title: "Finanzas Personales con Juan Haro", author: "Juan Haro", description: "Educación financiera en español para Latinoamérica.", link: "https://open.spotify.com/show/5u9RrMR7Pc7P4kXD7KKxDa", platform: "Spotify", language: 'es', category: 'basics' },
  { title: "Cracks Podcast", author: "Oso Trava", description: "Entrevistas con emprendedores exitosos de habla hispana.", link: "https://open.spotify.com/show/1a9v28nQJvJn8ITzZJbfDM", platform: "Spotify", language: 'es', category: 'entrepreneurship' },
  { title: "Inversión para Novatos", author: "Sergio Noguera", description: "Aprende a invertir desde cero en español.", link: "https://open.spotify.com/show/0WG8HGaGU8gWjsKVQKqLnv", platform: "Spotify", language: 'es', category: 'investing' },
  { title: "Balio", author: "Balio", description: "Finanzas personales e inversiones explicadas fácil.", link: "https://open.spotify.com/show/5XfHg0hL6zMmQrNQKvfKrv", platform: "Spotify", language: 'es', category: 'basics' },
  { title: "Inversor Global", author: "Diego Martínez", description: "Análisis de mercados y estrategias de inversión.", link: "https://open.spotify.com/show/5mLJzv5iIEMzx4NhYVhLlP", platform: "Spotify", language: 'es', category: 'investing' },
  { title: "Libros para Emprendedores", author: "Luis Ramos", description: "Resúmenes de libros de negocios y finanzas.", link: "https://open.spotify.com/show/0HXE6fGvO1VIoJCDDuYYZD", platform: "Spotify", language: 'es', category: 'entrepreneurship' },
  { title: "El Podcast de Finect", author: "Finect", description: "Educación financiera y actualidad económica.", link: "https://open.spotify.com/show/5qPJXxFDqxI8FG5gA3cP6X", platform: "Spotify", language: 'es', category: 'economics' },
  { title: "Negocios y Emprendimiento", author: "Negocios y Emprendimiento", description: "Ideas para emprender y hacer crecer tu negocio.", link: "https://open.spotify.com/show/0d9YhJK7TKXfx7aJu4z3V1", platform: "Spotify", language: 'es', category: 'entrepreneurship' },
];

// ==================== TED TALKS ====================
const TED_TALKS: Resource[] = [
  // English TED Talks
  { title: "How to Buy Happiness", author: "Michael Norton", description: "Cómo gastar dinero nos hace más felices.", descriptionEn: "How spending money can make us happier.", link: "https://www.ted.com/talks/michael_norton_how_to_buy_happiness", platform: "TED", language: 'en', category: 'happiness' },
  { title: "The Psychology of Your Future Self", author: "Dan Gilbert", description: "Por qué subestimamos cuánto cambiaremos.", descriptionEn: "Why we underestimate how much we'll change.", link: "https://www.ted.com/talks/dan_gilbert_the_psychology_of_your_future_self", platform: "TED", language: 'en', category: 'psychology' },
  { title: "What Makes a Good Life?", author: "Robert Waldinger", description: "El estudio más largo sobre la felicidad.", descriptionEn: "The longest study on happiness.", link: "https://www.ted.com/talks/robert_waldinger_what_makes_a_good_life_lessons_from_the_longest_study_on_happiness", platform: "TED", language: 'en', category: 'happiness' },
  { title: "The Battle Between Your Present and Future Self", author: "Daniel Goldstein", description: "Mejores decisiones financieras a largo plazo.", descriptionEn: "Better long-term financial decisions.", link: "https://www.ted.com/talks/daniel_goldstein_the_battle_between_your_present_and_future_self", platform: "TED", language: 'en', category: 'psychology' },
  { title: "How to Make Stress Your Friend", author: "Kelly McGonigal", description: "Cambia tu relación con el estrés financiero.", descriptionEn: "Change your relationship with financial stress.", link: "https://www.ted.com/talks/kelly_mcgonigal_how_to_make_stress_your_friend", platform: "TED", language: 'en', category: 'stress' },
  { title: "The Way We Think About Charity is Dead Wrong", author: "Dan Pallotta", description: "Repensar cómo medimos el impacto social.", descriptionEn: "Rethinking how we measure social impact.", link: "https://www.ted.com/talks/dan_pallotta_the_way_we_think_about_charity_is_dead_wrong", platform: "TED", language: 'en', category: 'charity' },
  { title: "How to Speak So That People Want to Listen", author: "Julian Treasure", description: "Comunicación efectiva para negocios.", descriptionEn: "Effective business communication.", link: "https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen", platform: "TED", language: 'en', category: 'communication' },
  { title: "The Happy Secret to Better Work", author: "Shawn Achor", description: "La ciencia de la felicidad y productividad.", descriptionEn: "The science of happiness and productivity.", link: "https://www.ted.com/talks/shawn_achor_the_happy_secret_to_better_work", platform: "TED", language: 'en', category: 'productivity' },
  { title: "Grit: The Power of Passion and Perseverance", author: "Angela Lee Duckworth", description: "La clave del éxito es la perseverancia.", descriptionEn: "The key to success is perseverance.", link: "https://www.ted.com/talks/angela_lee_duckworth_grit_the_power_of_passion_and_perseverance", platform: "TED", language: 'en', category: 'success' },
  { title: "Inside the Mind of a Master Procrastinator", author: "Tim Urban", description: "Por qué procrastinamos con nuestras finanzas.", descriptionEn: "Why we procrastinate with our finances.", link: "https://www.ted.com/talks/tim_urban_inside_the_mind_of_a_master_procrastinator", platform: "TED", language: 'en', category: 'productivity' },
  
  // Spanish TED Talks (TEDx en Español)
  { title: "¿Cómo ser millonario?", author: "Carlos Muñoz", description: "Emprendedor mexicano comparte su filosofía sobre el dinero.", link: "https://www.youtube.com/watch?v=TYQl8iNZQVQ", platform: "TEDx", language: 'es', category: 'entrepreneurship' },
  { title: "El secreto para crear riqueza", author: "Brian Tracy (en español)", description: "Las claves para crear abundancia financiera.", link: "https://www.youtube.com/watch?v=q4HO0yK3E4Y", platform: "YouTube", language: 'es', category: 'mindset' },
  { title: "Inteligencia Financiera", author: "Sofía Macías", description: "La autora de Pequeño Cerdo Capitalista habla sobre dinero.", link: "https://www.youtube.com/watch?v=Yo6w4kN9hk8", platform: "TEDx", language: 'es', category: 'basics' },
  { title: "El Arte de Invertir", author: "Francisco García Paramés", description: "El mejor inversor español explica su filosofía.", link: "https://www.youtube.com/watch?v=7sKZ1MgqzI0", platform: "YouTube", language: 'es', category: 'investing' },
  { title: "Cómo Vencer el Miedo al Dinero", author: "Varios", description: "Superar las barreras mentales con el dinero.", link: "https://www.youtube.com/watch?v=p9NcJ2t7kFk", platform: "TEDx", language: 'es', category: 'mindset' },
  { title: "El Poder del Ahorro", author: "Juan Haro", description: "Por qué ahorrar es el primer paso hacia la libertad.", link: "https://www.youtube.com/watch?v=8aJd1Qm7xWc", platform: "TEDx", language: 'es', category: 'saving' },
  { title: "Emprender sin Miedo", author: "Andy Freire", description: "Lecciones de uno de los emprendedores más exitosos de Latinoamérica.", link: "https://www.youtube.com/watch?v=DHYxKF8SKBE", platform: "TEDx", language: 'es', category: 'entrepreneurship' },
  { title: "La Mentalidad del Éxito", author: "Yokoi Kenji", description: "Disciplina japonesa aplicada a las finanzas personales.", link: "https://www.youtube.com/watch?v=pN8lL2QOXWU", platform: "TEDx", language: 'es', category: 'mindset' },
  { title: "Finanzas para Todos", author: "Mario Borghino", description: "Cómo cualquier persona puede mejorar su situación financiera.", link: "https://www.youtube.com/watch?v=kI_6mXqBn3E", platform: "TEDx", language: 'es', category: 'basics' },
  { title: "El Precio de la Felicidad", author: "Laurie Santos (subtitulado)", description: "La ciencia de lo que realmente nos hace felices.", link: "https://www.youtube.com/watch?v=GXy__kBVq1M", platform: "TEDx", language: 'es', category: 'happiness' },
];

// ==================== YOUTUBE CHANNELS ====================
const YOUTUBE_CHANNELS: Resource[] = [
  // English Channels
  { title: "Graham Stephan", description: "Inversiones, bienes raíces y finanzas personales.", descriptionEn: "Investments, real estate, and personal finance.", link: "https://www.youtube.com/@GrahamStephan", platform: "YouTube", language: 'en', category: 'investing' },
  { title: "Andrei Jikh", description: "Inversiones y FIRE con visuales increíbles.", descriptionEn: "Investing and FIRE with amazing visuals.", link: "https://www.youtube.com/@AndreiJikh", platform: "YouTube", language: 'en', category: 'fire' },
  { title: "The Plain Bagel", description: "Conceptos financieros explicados de forma simple.", descriptionEn: "Financial concepts explained simply.", link: "https://www.youtube.com/@ThePlainBagel", platform: "YouTube", language: 'en', category: 'basics' },
  { title: "Whiteboard Finance", description: "Educación financiera con pizarra.", descriptionEn: "Financial education with whiteboard explanations.", link: "https://www.youtube.com/@WhiteboardFinance", platform: "YouTube", language: 'en', category: 'basics' },
  { title: "Two Cents", description: "Finanzas personales de PBS Digital Studios.", descriptionEn: "Personal finance from PBS Digital Studios.", link: "https://www.youtube.com/@TwoCentsPBS", platform: "YouTube", language: 'en', category: 'basics' },
  { title: "Ben Felix", description: "Inversión basada en evidencia académica.", descriptionEn: "Evidence-based academic investing.", link: "https://www.youtube.com/@BenFelixCSI", platform: "YouTube", language: 'en', category: 'investing' },
  { title: "Minority Mindset", description: "Educación financiera para millennials.", descriptionEn: "Financial education for millennials.", link: "https://www.youtube.com/@MinorityMindset", platform: "YouTube", language: 'en', category: 'basics' },
  { title: "Our Rich Journey", description: "Familia que logró FIRE y viaja por el mundo.", descriptionEn: "Family who achieved FIRE and travels the world.", link: "https://www.youtube.com/@OurRichJourney", platform: "YouTube", language: 'en', category: 'fire' },
  { title: "The Financial Diet", description: "Finanzas personales y lifestyle.", descriptionEn: "Personal finance and lifestyle.", link: "https://www.youtube.com/@TheFinancialDiet", platform: "YouTube", language: 'en', category: 'lifestyle' },
  { title: "Nate O'Brien", description: "Minimalismo y finanzas para jóvenes.", descriptionEn: "Minimalism and finance for young adults.", link: "https://www.youtube.com/@NateOBrien", platform: "YouTube", language: 'en', category: 'minimalism' },
  
  // Spanish Channels
  { title: "Kiyosaki en Español", author: "Robert Kiyosaki", description: "Canal oficial en español con lecciones de inversión.", link: "https://www.youtube.com/@RobertKiyosakiEspanol", platform: "YouTube", language: 'es', category: 'investing' },
  { title: "Pequeño Cerdo Capitalista", author: "Sofía Macías", description: "Finanzas personales para principiantes.", link: "https://www.youtube.com/@PequenoCerdoCapitalista", platform: "YouTube", language: 'es', category: 'basics' },
  { title: "Juan Ramón Rallo", description: "Economía y finanzas desde perspectiva liberal.", link: "https://www.youtube.com/@juanrallo", platform: "YouTube", language: 'es', category: 'economics' },
  { title: "Value School", description: "Educación financiera e inversión en valor.", link: "https://www.youtube.com/@ValueSchool", platform: "YouTube", language: 'es', category: 'investing' },
  { title: "El Club de Inversión", author: "Andrea Redondo", description: "Inversiones explicadas para principiantes.", link: "https://www.youtube.com/@elclubdeinversion", platform: "YouTube", language: 'es', category: 'investing' },
  { title: "Inversión Racional", description: "Análisis de inversiones y educación financiera.", link: "https://www.youtube.com/@InversionRacional", platform: "YouTube", language: 'es', category: 'investing' },
  { title: "Adrián Sáenz", description: "Finanzas personales y emprendimiento.", link: "https://www.youtube.com/@AdrianSaenz", platform: "YouTube", language: 'es', category: 'entrepreneurship' },
  { title: "Eduardo Rosas", description: "Educación financiera y consejos prácticos.", link: "https://www.youtube.com/@EduardoRosas", platform: "YouTube", language: 'es', category: 'basics' },
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
    case 'hbo max': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'paramount+': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'hulu': return 'bg-green-600/10 text-green-500 border-green-600/20';
    case 'apple tv+': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    case 'showtime': return 'bg-red-700/10 text-red-700 border-red-700/20';
    default: return 'bg-primary/10 text-primary border-primary/20';
  }
};

const getResourceKey = (resource: Resource) => `${resource.title}-${resource.link}`;

const ResourceCard = ({ 
  resource, 
  isFavorite, 
  onToggleFavorite,
  language 
}: { 
  resource: Resource; 
  isFavorite: boolean;
  onToggleFavorite: (resource: Resource) => void;
  language: string;
}) => {
  const description = language === 'en' && resource.descriptionEn ? resource.descriptionEn : resource.description;
  
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
      <a href={resource.link} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{resource.title}</h4>
          <Badge variant="outline" className={`text-xs ${getPlatformColor(resource.platform)}`}>{resource.platform}</Badge>
          <Badge variant="outline" className="text-xs">
            {resource.language === 'es' ? '🇪🇸 ES' : resource.language === 'en' ? '🇬🇧 EN' : '🌍 Both'}
          </Badge>
        </div>
        {resource.author && <p className="text-xs text-muted-foreground mt-0.5">{resource.author}</p>}
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
      </a>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.preventDefault(); onToggleFavorite(resource); }}>
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
        </Button>
        <a href={resource.link} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>
      </div>
    </div>
  );
};

export function FinancialLibrary() {
  const { language: appLanguage } = useLanguage();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [languageFilter, setLanguageFilter] = useState<'all' | 'es' | 'en'>('all');
  const [activeTab, setActiveTab] = useState('books');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('financial-education-favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = (resource: Resource) => {
    const key = getResourceKey(resource);
    const newFavorites = favorites.includes(key) ? favorites.filter(f => f !== key) : [...favorites, key];
    setFavorites(newFavorites);
    localStorage.setItem('financial-education-favorites', JSON.stringify(newFavorites));
  };

  const filterResources = (resources: Resource[]) => {
    return resources.filter(r => {
      const matchesLanguage = languageFilter === 'all' || r.language === languageFilter || r.language === 'both';
      const matchesSearch = searchQuery === '' || 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLanguage && matchesSearch;
    });
  };

  const favoriteResources = ALL_RESOURCES.filter(r => favorites.includes(getResourceKey(r)));
  const filteredFavorites = filterResources(favoriteResources);

  const stats = useMemo(() => ({
    totalResources: ALL_RESOURCES.length,
    spanishResources: ALL_RESOURCES.filter(r => r.language === 'es').length,
    englishResources: ALL_RESOURCES.filter(r => r.language === 'en').length,
    books: BOOKS.length,
  }), []);

  const ResourceSection = ({ resources }: { resources: Resource[] }) => {
    const filtered = filterResources(resources);
    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {appLanguage === 'es' ? 'No hay recursos disponibles con estos filtros' : 'No resources available with these filters'}
        </div>
      );
    }
    return (
      <div className="grid gap-2">
        {filtered.map((resource, index) => (
          <ResourceCard 
            key={index} 
            resource={resource} 
            isFavorite={favorites.includes(getResourceKey(resource))}
            onToggleFavorite={toggleFavorite}
            language={appLanguage}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          {appLanguage === 'es' ? 'Biblioteca de Educación Financiera' : 'Financial Education Library'}
        </CardTitle>
        <CardDescription>
          {appLanguage === 'es' 
            ? `${stats.totalResources} recursos: ${stats.books} libros, documentales, películas, series, podcasts, TED Talks y canales de YouTube`
            : `${stats.totalResources} resources: ${stats.books} books, documentaries, movies, series, podcasts, TED Talks and YouTube channels`}
        </CardDescription>
        
        {/* Stats badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary" className="text-xs">
            📚 {stats.books} {appLanguage === 'es' ? 'libros' : 'books'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            🇪🇸 {stats.spanishResources} {appLanguage === 'es' ? 'en español' : 'in Spanish'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            🇬🇧 {stats.englishResources} {appLanguage === 'es' ? 'en inglés' : 'in English'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            ⭐ {favorites.length} {appLanguage === 'es' ? 'favoritos' : 'favorites'}
          </Badge>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={appLanguage === 'es' ? 'Buscar recursos...' : 'Search resources...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <ToggleGroup type="single" value={languageFilter} onValueChange={(v) => v && setLanguageFilter(v as 'all' | 'es' | 'en')}>
              <ToggleGroupItem value="all" size="sm">{appLanguage === 'es' ? 'Todos' : 'All'}</ToggleGroupItem>
              <ToggleGroupItem value="es" size="sm">🇪🇸 ES</ToggleGroupItem>
              <ToggleGroupItem value="en" size="sm">🇬🇧 EN</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1 mb-4">
            <TabsTrigger value="favorites" className="flex items-center gap-1.5 text-xs">
              ⭐ {appLanguage === 'es' ? 'Favoritos' : 'Favorites'}
              {favorites.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{favorites.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-1.5 text-xs">
              📚 {appLanguage === 'es' ? 'Libros' : 'Books'}
            </TabsTrigger>
            <TabsTrigger value="documentaries" className="flex items-center gap-1.5 text-xs">
              🎬 {appLanguage === 'es' ? 'Docs' : 'Docs'}
            </TabsTrigger>
            <TabsTrigger value="movies" className="flex items-center gap-1.5 text-xs">
              🎥 {appLanguage === 'es' ? 'Películas' : 'Movies'}
            </TabsTrigger>
            <TabsTrigger value="series" className="flex items-center gap-1.5 text-xs">
              📺 Series
            </TabsTrigger>
            <TabsTrigger value="podcasts" className="flex items-center gap-1.5 text-xs">
              🎧 Podcasts
            </TabsTrigger>
            <TabsTrigger value="ted" className="flex items-center gap-1.5 text-xs">
              🎤 TED
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-1.5 text-xs">
              ▶️ YouTube
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] pr-4">
            <TabsContent value="favorites">
              {filteredFavorites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>{appLanguage === 'es' ? 'No tienes favoritos aún' : 'No favorites yet'}</p>
                  <p className="text-sm mt-1">{appLanguage === 'es' ? 'Marca recursos con ⭐ para verlos aquí' : 'Mark resources with ⭐ to see them here'}</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filteredFavorites.map((resource, index) => (
                    <ResourceCard key={index} resource={resource} isFavorite={true} onToggleFavorite={toggleFavorite} language={appLanguage} />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="books"><ResourceSection resources={BOOKS} /></TabsContent>
            <TabsContent value="documentaries"><ResourceSection resources={DOCUMENTARIES} /></TabsContent>
            <TabsContent value="movies"><ResourceSection resources={MOVIES} /></TabsContent>
            <TabsContent value="series"><ResourceSection resources={SERIES} /></TabsContent>
            <TabsContent value="podcasts"><ResourceSection resources={PODCASTS} /></TabsContent>
            <TabsContent value="ted"><ResourceSection resources={TED_TALKS} /></TabsContent>
            <TabsContent value="youtube"><ResourceSection resources={YOUTUBE_CHANNELS} /></TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
