# Handoff: Laborativo Diagnóstico

Design handoff para el diagnosticador cultural de Laborativo.

---

## 1. Overview

Laborativo Diagnóstico es una herramienta de evaluación cultural organizacional. Un equipo responde 18 preguntas cruzadas (auto/hetero evaluación en 4 niveles) sobre 4 dimensiones — **Intención, Motivación, Interacción, Acción** — y el producto devuelve un reporte que mapea las brechas entre cómo el líder se percibe y cómo lo percibe el equipo. El reporte funciona como puerta de entrada a los servicios de consultoría de Laborativo.

El flujo tiene tres superficies:
- **Admin** (creación y listado de diagnósticos) — aún no mockeada en el prototipo, ver sección 5.
- **Participante** (landing → ingreso → preguntas).
- **Resultados** (dashboard de brechas).

---

## 2. About the Design Files

Los archivos de este bundle son **referencias de diseño creadas en HTML** — prototipos que muestran el look & feel y el comportamiento deseado, **no código de producción para copiar directamente**.

La tarea es **recrear estos diseños en el stack objetivo** (Next.js 16 + React + Tailwind v4 + Supabase) usando los patrones ya establecidos en el repo `Laborativo_Diagnostico`. El HTML es solo una especificación visual muy detallada.

**Archivo principal de referencia:** `design-prototype.html` (también presente en la raíz del repo como indicó el cliente).

---

## 3. Fidelity

**High-fidelity.** Los mockups son pixel-perfect en cuanto a colores, tipografía, spacing, layout y micro-interacciones. Recrear con precisión usando Tailwind v4 y los tokens definidos abajo. Todas las medidas, pesos tipográficos y valores hex son finales.

---

## 4. Stack objetivo y arquitectura recomendada

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind v4 (usar `@theme` para los tokens de abajo)
- **Persistencia:** Supabase (auth, postgres, RLS)
- **Fuente:** Red Hat Display — servirla local desde `/public/fonts` (ttf en este bundle) o via `next/font/google`
- **Charts:** Recomendado `recharts` o SVG a mano (el prototipo usa SVG a mano, que es más ligero y fiel al diseño)

### Estructura sugerida de rutas

```
app/
├── (marketing)/
│   └── page.tsx                    # 01 Landing (público)
├── diag/[code]/
│   ├── intake/page.tsx             # 02 Ingreso del participante
│   ├── q/[idx]/page.tsx            # 03 Pregunta N/18
│   └── results/page.tsx            # 04 Resultados del equipo
├── admin/
│   ├── page.tsx                    # Lista de diagnósticos
│   └── new/page.tsx                # Crear nuevo diagnóstico
└── about/page.tsx                  # Metodología
```

### Esquema de datos (Supabase)

```sql
-- Diagnósticos (creados desde admin)
diagnostics (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,            -- "LAB-0042"
  team_name text not null,
  accent_hex text not null default '#D8FF00',
  created_at timestamptz default now(),
  closes_at timestamptz,
  status text default 'open'            -- open | closed | archived
)

-- Participantes (anónimos — solo rol + área)
participants (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid references diagnostics(id),
  role text not null,                   -- 'member' | 'leader'
  area text,
  created_at timestamptz default now()
)

-- Respuestas (1-5 en escala Likert + comentario opcional)
answers (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id),
  question_id int not null,             -- 1..18
  dimension text not null,              -- 'intention' | 'motivation' | 'interaction' | 'action'
  level int not null,                   -- 1..4 (autoevaluación, autoev. líder, líder→equipo, equipo→líder)
  value int not null check (value between 1 and 5),
  comment text,
  created_at timestamptz default now()
)

-- Preguntas (catálogo, semilla fija de 18)
questions (
  id int primary key,
  dimension text not null,
  level int not null,
  prompt text not null,
  context text
)
```

**RLS:** `answers` y `participants` solo legibles en modo agregado (funciones RPC que devuelven promedios, nunca rows individuales). `diagnostics` legibles por `code` público. Admin con auth de Supabase.

---

## 5. Vistas / Screens

El prototipo HTML contiene 4 pantallas (`01 Landing`, `02 Ingreso`, `03 Pregunta`, `04 Resultados`). El cliente pidió además 2 pantallas de admin y subdividir el participante — a continuación el mapeo completo de **5 vistas finales**:

### 5.1 Admin · Lista de diagnósticos (NO mockeada)

**A diseñar desde cero usando el mismo sistema.** Tabla/grid de diagnósticos existentes:
- Sidebar igual al del prototipo (`aside` de la raíz de `design-prototype.html`)
- Header con título `Diagnósticos` + botón `+ Nuevo diagnóstico →`
- Tabla: código, equipo, fecha, participación (ej. "12/15"), color acento (pill), estado, acción (ver resultados)
- Misma tipografía de tabla que `.gaps` en el prototipo (ver sección 7 de este README)

### 5.2 Admin · Crear diagnóstico (NO mockeada)

Formulario — misma estética que `02 Ingreso`:
- Campo: nombre del equipo
- Campo: código (autogenerado, editable: `LAB-0043`)
- Campo: fecha de cierre
- **Color acento neón:** color picker con 6 swatches predefinidos (ver Tweaks del prototipo — D8FF00, 00FF85, 00E5FF, FF3DFF, FF4D00, FFFF00) + input hex libre
- Botón: `Crear y copiar link →`
- Al crear: mostrar el link público `app.laborativo.com/diag/LAB-0043`

### 5.3 Participante · Landing + selección de perfil

**Referencia:** `design-prototype.html` → screens `landing` + `intake`.

El prototipo separa Landing e Intake en dos screens. El cliente pidió unificarlos conceptualmente como "selección de perfil". Dos opciones:
- **(A)** Mantener las dos pantallas separadas (recomendado — el landing tiene peso editorial y es parte de la narrativa de Laborativo).
- **(B)** Colapsar a una sola vista con selector de rol (miembro / líder) al arrancar.

Si vas por (B), conservar el hero tipográfico `Un espejo para equipos que quieren verse con honestidad.` como encabezado de la pantalla única.

**Selección de rol:** dos cards (`.role` en el prototipo) — "Miembro del equipo" / "Líder del equipo". Estado `sel` = fondo negro + texto blanco.

### 5.4 Participante · Formulario (pregunta 1 a 18, mostradas de a una)

**Referencia:** `design-prototype.html` → screen `question`.

- Header sticky con progress bar + dimensión actual
- Grande número 04 tipográfico + eyebrow del nivel y dimensión
- Título de la pregunta (max 22ch, 40px, weight 900)
- Contexto (max 60ch, 15px, weight 500)
- Escala 1-5 horizontal (`.scale-opt`), cada opción con número grande + label corto + descriptor en caps
- Comentario opcional (un solo `input` con `border-bottom`)
- Sidebar derecho (`.qsidebar`): pills de los 4 niveles + lista de dimensiones con progreso

**Transición entre preguntas:** fade + slide horizontal suave (150ms, ease-out). En el prototipo es instantáneo; implementar con Framer Motion o `view-transition-name`.

### 5.5 Resultados · Dot plot

**Referencia:** `design-prototype.html` → screen `results`.

El prototipo usa radar + barras de brecha. El cliente pidió específicamente **dot plot** como gráfica principal. Reemplazar el radar `#radar` por un dot plot:

- **Eje Y:** 4 dimensiones (Intención, Motivación, Interacción, Acción)
- **Eje X:** escala 1-5
- **4 puntos por fila**, uno por perspectiva (autoev. equipo, autoev. líder, líder→equipo, equipo→líder)
- Líneas horizontales que conectan los puntos para hacer visible la brecha
- Usar el acento neón del diagnóstico solo para uno de los puntos (auto-líder) — los demás en negro/blanco/patrón

Mantener el resto de secciones tal cual:
- Header con título + metadata (equipo, participación, fecha, brecha mayor)
- 4 score cards (una por dimensión) con número grande + pill de brecha + mini barra
- Tabla de detalle por pregunta (`.gaps`)
- Insights: 3 cards con recomendaciones (una con fondo neón como acento)
- Closing CTA (`Agendar sesión de lectura →`)

---

## 6. Interactions & Behavior

### Navegación
- Landing → botón `Iniciar diagnóstico →` → Intake
- Intake → selección de rol → `Comenzar preguntas →` → Pregunta 1
- Pregunta N → selección de valor 1-5 → `Siguiente →` → Pregunta N+1 (o Resultados si N=18)
- `← Anterior` y `Omitir` disponibles en cada pregunta
- Resultados accesible por el admin y por el participante al terminar (y persistente al refrescar)

### Estados visuales
- **Hover** en botones `.btn`: fondo negro, texto fondo (flip completo, 150ms)
- **Hover** en `.btn.primary`: fondo neón, borde neón, texto negro
- **Hover** en `.dim`, `.role`, `.scale-opt`: fondo neón
- **Seleccionado** (`.sel`, `.active`): fondo negro, texto blanco
- **Focus** en inputs: `border-bottom-color: neon` + `box-shadow: 0 2px 0 neon`

### Persistencia
- La ruta de la pregunta actual se guarda en URL (`/diag/:code/q/:idx`) — no en localStorage como el prototipo
- Respuestas se guardan en Supabase al hacer click en `Siguiente →` (upsert por `participant_id + question_id`)
- Al refrescar, restaurar desde la última respuesta guardada

### Animaciones
- Progress bar: `transition: width .4s ease`
- Transición entre screens: fade + slide (implementar con Framer Motion)
- Charts: dibujar con stroke animation al entrar (dasharray → 0)

### Responsive
- El prototipo está diseñado a 1440px. Para móvil:
  - Sidebar → menú hamburguesa
  - Intake grid 1fr 1fr → 1 columna, side panel arriba
  - Question grid 1fr 240px → 1 columna, sidebar colapsable abajo
  - Scale 5 columnas → 2 filas de 2-3
  - Results charts grid 1fr 1fr → 1 columna

---

## 7. Design Tokens

### Colores

```css
--bg:       #E6E6E6;   /* gris 10% — fondo principal. Cliente pidió #F5F5F5, ajustable */
--bg-2:     #DADADA;   /* gris secundario (headers de tabla, subfondo) */
--paper:    #F2F2F2;   /* gris claro para secciones alternas */
--card:     #FFFFFF;   /* fondo de cards */
--ink:      #0A0A0A;   /* tinta principal (texto, bordes) */
--ink-2:    #1A1A1A;   /* tinta secundaria (párrafos) */
--mute:     #7A7A7A;   /* texto muted */
--line:     #0A0A0A;   /* bordes duros */
--line-soft: rgba(10,10,10,.14); /* divisores suaves */
--neon:     #D8FF00;   /* ACENTO — configurable por diagnóstico */
```

**Nota crítica sobre el acento neón:** debe ser **configurable por diagnóstico** (guardado en `diagnostics.accent_hex`). Inyectar como CSS var en el `<html>` root al cargar el diagnóstico. Swatches sugeridos: `#D8FF00, #00FF85, #00E5FF, #FF3DFF, #FF4D00, #FFFF00`.

### Tipografía

- **Familia:** Red Hat Display (cargar desde `/public/fonts/` — archivos TTF en `fonts/` de este bundle)
- **Pesos disponibles:** 300, 400, 500, 600, 700, 800, 900 (+ italic en 400 y 700)
- **Feature:** antialiasing `-webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility`

**Escala (valores exactos del prototipo):**

| Uso | font-size | line-height | letter-spacing | font-weight |
|---|---|---|---|---|
| Display hero | `clamp(64px, 8.4vw, 136px)` | `.88` | `-0.045em` | 900 |
| H1 results | `clamp(48px, 6vw, 88px)` | `.88` | `-1px` | 900 |
| H2 sections | `clamp(36px, 4.2vw, 64px)` | `.92-.95` | `-0.035em` | 900 |
| H2 intake side | `64px` | `.92` | `-1px` | 900 |
| Question title | `40px` | `1.05` | `-1px` | 900 |
| Pregunta número (04) | `88px` | `.88` | `-1px` | 900 |
| Score big number | `88px` | `1` | `-1px` | 900 |
| H3 card titles | `26-32px` | `1` | `-1px` / `-0.5px` | 900 |
| H4 (levels, insights) | `20-22px` | `1.05-1.1` | `-0.5px` / `-0.02em` | 800-900 |
| Body | `14-17px` | `1.45-1.55` | normal | 500 |
| Eyebrow | `10-11px` | `1` | `0.5px` (tracking amplio) | 700 — **UPPERCASE** |
| Button label | `14px` | `1` | `-0.01em` | 700 |

### Spacing

Grid base de 4px. Valores más comunes: `8 10 12 14 16 20 24 28 32 40 48 56 64 72 80`.
- Padding de secciones: `56px` horizontal, `48-80px` vertical
- Gap entre cards en grids: `0` (bordes compartidos) o `16px`
- Border width consistente: **`1.5px`** (NO 1px, NO 2px — este es un detalle crítico)

### Bordes y radii

- **`border-radius: 0`** en TODO. Sin excepciones. El sistema es ortogonal.
- Única excepción posible: `.neon-dot i` y el círculo de `.chev` (pero en esta versión el chev ya se reemplazó por `→` literal).

### Shadows

Sin shadows flotantes. Única sombra: **`box-shadow: 6px 6px 0 var(--ink)`** en el panel de Tweaks (sombra dura, estilo brutalist, sin blur). No usar esta sombra en producción salvo para elementos secundarios / debug.

---

## 8. Assets

- `assets/laborativo-logo.png` — logo wordmark. Mover a `/public/brand/` en Next.
- `fonts/RedHatDisplay-*.ttf` — 9 archivos. Mover a `/public/fonts/` y declarar con `@font-face` o `next/font/local`.
- **No hay iconografía.** El sistema evita iconos deliberadamente; usar tipografía + símbolos Unicode cuando haga falta (`→ ← · Δ ✓`).

---

## 9. Contenido / Copy

Todo el copy del prototipo está en español y es **contenido final aprobado por el cliente**. No inventar ni parafrasear. Los strings clave (preguntas, descripciones, CTAs) deben migrarse literalmente.

Las **18 preguntas** del catálogo aún no están en el prototipo (solo se muestra una de ejemplo). El cliente deberá proveer el catálogo completo para la tabla `questions`. Por ahora el desarrollador puede stubbear con placeholders y dejar el TODO marcado.

---

## 10. Archivos de este bundle

```
design_handoff_laborativo_diagnostico/
├── README.md                          ← este archivo
├── design-prototype.html              ← prototipo completo (4 screens + about)
├── assets/
│   └── laborativo-logo.png
├── fonts/
│   └── RedHatDisplay-*.ttf           (9 archivos)
└── screenshots/
    ├── 01-landing.png
    ├── 02-intake.png
    ├── 03-question.png
    └── 04-results.png
```

**Cómo usar el prototipo:** abrir `design-prototype.html` en un navegador. El sidebar izquierdo permite navegar entre las 4 screens + metodología. El botón "Tweaks" (bottom-right) expone variaciones de color acento, tema y peso tipográfico — útil para ver cómo se comporta el sistema.

---

## 11. Prioridades sugeridas (primer sprint)

1. Tokens + tipografía + sidebar de app — base visual
2. Vista 5.3 (Landing + Intake participante) con ruta pública `/diag/:code/intake`
3. Vista 5.4 (Pregunta) con persistencia Supabase — la mitad del valor del producto
4. Vista 5.5 (Resultados) con dot plot — el entregable
5. Vistas 5.1 y 5.2 (Admin) — pueden ir después si el cliente genera diagnósticos manualmente al principio

---

## 12. Notas finales

- El cliente pidió fondo `#F5F5F5` — el prototipo usa `#E6E6E6` (más oscuro/dramático). Coordinar cuál queda final; los tokens están listos para cambiar en un solo sitio.
- El prototipo tiene una screen extra "Metodología" (`about`) que puede o no migrarse según alcance.
- Ante dudas: el prototipo es la verdad. Si README y prototipo difieren, ganan los valores del HTML.
