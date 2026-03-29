

# Agregar Más Libros Top a la Biblioteca

## Libros que YA tenemos (~98 recursos entre libros, docs, películas, series)
Kiyosaki (10), Clear (2), Tracy (10), Rohn (10), Clason, Graham, Hill, Dalio, Macías, Robin, Stanley, Robbins, Housel, Lynch, Pabrai, Eker, Samsó, Melé, Hardy, Michalowicz, Sharma, Malkiel, Collins, Sethi, Ramsey, Bogle, Perkins, Larimore, Ferriss, DeMarco, Trench, Bach, Chilton, Pape, Fisker, Shen, Sabatier, Warren, Galán, Yeager

## Libros TOP que FALTAN (25 nuevos)

**Español:**
1. "Padre Rico, Padre Pobre para Jóvenes" — Robert Kiyosaki (versión juvenil, basics)
2. "El Cuadrante del Flujo de Dinero" ya está. Skip.
3. "Aprendiendo de los Mejores" — Francisco Alcaide (mindset, bestseller hispano)
4. "De Cero a Inversionista" — Omar Educación Financiera (investing, LatAm)
5. "Empieza con el Porqué" — Simon Sinek (mindset)
6. "El Club de las 5 de la Mañana" — Robin Sharma (habits)
7. "Los 7 Hábitos de la Gente Altamente Efectiva" — Stephen Covey (habits)
8. "La Semana Laboral de 4 Horas" — Tim Ferriss (entrepreneurship, versión ES)
9. "El Efecto Compuesto" — Darren Hardy (habits, versión ES)
10. "Despierta tu Héroe Interior" — Víctor Hugo Manzanilla (mindset, LatAm)

**English:**
11. "Rich Dad Poor Dad for Teens" — Robert Kiyosaki (basics)
12. "The Lean Startup" — Eric Ries (entrepreneurship)
13. "Start with Why" — Simon Sinek (mindset)
14. "The 7 Habits of Highly Effective People" — Stephen Covey (habits)
15. "The Richest Man Who Ever Lived" — Steven K. Scott (wealth)
16. "You Are a Badass at Making Money" — Jen Sincero (mindset)
17. "The Dhandho Investor" ya está. Skip.
18. "Rich AF" — Vivian Tu (basics, Gen Z)
19. "The Algebra of Wealth" — Scott Galloway (wealth)
20. "Same as Ever" — Morgan Housel (mindset)
21. "Just Keep Buying" — Nick Maggiulli (investing)
22. "The Subtle Art of Not Giving a F*ck" — Mark Manson (mindset)
23. "Can't Hurt Me" — David Goggins (mindset)
24. "Never Split the Difference" — Chris Voss (business)
25. "Build the Life You Want" — Arthur C. Brooks (mindset)

## Implementación

**Archivo**: `src/components/mentorship/FinancialLibrary.tsx`
- Insertar 25 nuevos libros en el array `BOOKS` antes de la línea 150 (cierre del array)
- Organizados en secciones con comentarios: `// ========== MODERN CLASSICS (ES) ==========` y `// ========== MODERN CLASSICS (EN) ==========`
- Cada uno con: title, author, description, link (Amazon real), platform, language, category

