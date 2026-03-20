# Portfolio Insight

Landing page personal de **Maximiliano Yommi** — CEO & Co-Founder de [Cumbre IA](https://cumbre.cloud/). Hosteada en **GitHub Pages**.

## Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Animaciones**: Framer Motion
- **Iconos**: lucide-react + SVGs inline (brand icons)
- **Font**: Inter (sans) + JetBrains Mono (mono), via Google Fonts
- **Deploy**: GitHub Pages via GitHub Actions (`npm run build` → `dist/`)

## Arquitectura

Single-page app con una sola card hero + footer. Sin routing.

```
src/
├── App.tsx          # Componente principal (todo el contenido)
├── index.css        # Tailwind imports + design tokens + clases custom
├── main.tsx         # Entry point
└── assets/
    └── avatar.png   # Foto de perfil
```

## Diseño

### Glassmorphism dark theme

Todos los estilos glass se aplican con **inline styles** (`style={{}}`) para evitar conflictos con Tailwind CSS v4 layers. Las clases CSS custom deben ir siempre dentro de `@layer base` o `@layer components` en `index.css` — cualquier CSS fuera de `@layer` sobreescribe las utilidades de Tailwind.

Estilos glass centralizados en el objeto `glass` al top de `App.tsx`:
- `glass.outer` — card principal
- `glass.card` / `glass.cardHover` — info cards
- `glass.profile` — panel de perfil
- `glass.social` / `glass.socialHover` — links sociales
- `glass.badge` — badge "Portfolio Insight"
- `glass.avatar` — foto de perfil
- `glass.iconCircle` — círculos de iconos

### Fondo animado (Neural Mesh)

Canvas 2D con nodos flotantes conectados por líneas (estilo neural network):
- 80 nodos con velocidad y pulso individual
- Conexiones cuando la distancia < 180px
- Repulsión sutil del mouse
- Glow tenue azul siguiendo el cursor
- DPR-aware, cleanup en unmount

### Paleta

Dark theme monocromo. Background `#0a0a0a`, foreground `#fafafa`. Colores solo via opacidad de blanco (`rgba(255,255,255, 0.03-0.12)`). Tokens definidos en `@theme` de `index.css`.

### Tipografía

- **Headings**: font-semibold, tracking negativo (`-0.035em`), responsive scaling
- **Labels**: uppercase, tracking ultra-ancho (`0.28-0.32em`), tamaño 7-10px
- **Body**: opacidad 40-50%, leading 1.5-1.7

## Layout responsive

La card debe entrar en una sola pantalla sin scroll en desktop/tablet/notebook:

| Breakpoint | Dispositivo | Comportamiento |
|---|---|---|
| `< 768px` | Mobile | Scroll normal, stack vertical, profile card arriba |
| `md` (768px+) | Tablet | Fullscreen (`h-screen overflow-hidden` en main), 2 columnas |
| `lg` (1024px+) | Notebook (1366x768) | Fullscreen, tamaños compactos para ~680px útiles |
| `xl` (1280px+) | Desktop | Fullscreen, spacing generoso |

Cada elemento tiene 4-5 breakpoints de tamaño (mobile → sm → md → lg → xl). El profile card usa `order-first md:order-last` para mostrarse arriba en mobile y a la derecha en desktop.

## Comandos

```bash
npm install      # Instalar dependencias
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
```

## Deploy

GitHub Actions workflow en `.github/workflows/deploy.yml`. Cada push a `main` hace build y deploy automático.

Configurar en el repo: **Settings > Pages > Source: GitHub Actions**.

URL: `https://maxiyommi.github.io/portfolio_insight/`

## Reglas de desarrollo

- **Tailwind v4**: CSS custom SIEMPRE dentro de `@layer base` o `@layer components`. Nunca fuera de layer.
- **Glass styles**: usar inline `style={{}}`, no clases CSS custom. Centralizar en el objeto `glass`.
- **Responsive**: toda propiedad visual debe tener variantes md/lg/xl. Priorizar que quepa en 768px de alto.
- **Paleta monocromo**: solo blanco con opacidad variable. Sin colores saturados.
- **Animaciones**: Framer Motion para entradas (fadeUp, scaleIn, stagger). Tailwind transitions para hovers.
- `base: '/portfolio_insight/'` en `vite.config.ts` para GitHub Pages.
