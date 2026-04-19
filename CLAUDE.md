# Laborativo_Diagnostico

Herramienta de diagnóstico organizacional para Laborativo. Puerta de entrada para nuevos clientes: permite entender la situación de cultura de una organización y las brechas de comportamiento entre líderes y equipos.

## Stack
- Next.js 16 + TypeScript + Tailwind v4
- Supabase (DB + Auth para admin)
- Claude API (generación de preguntas contextualizadas + web search)
- Resend (envío de emails)

## Las 4 dimensiones
Toda evaluación se estructura sobre estas dimensiones (orden fijo):
1. **Intención** — Sentido — ¿A dónde vamos?
2. **Motivación** — Energía — ¿Por qué?
3. **Interacción** — Vínculos — ¿Con quién?
4. **Acción** — Comportamiento — ¿Qué?

## Los 4 roles (perspectivas)
- **A** — Equipo (auto-evaluación)
- **B** — Líder → Equipo (líder evalúa al equipo)
- **C** — Equipo → Líder (equipo evalúa al líder)
- **D** — Líder auto (auto-evaluación del líder)

Cada dimensión tiene preguntas distintas por rol (misma temática, diferente perspectiva). Escala de respuesta: 1–10.

## Las 3 superficies

### 1. Admin `/admin`
- Solo accesible por el equipo de Laborativo (auth Supabase)
- Lista todos los diagnósticos con su estado
- Crear diagnóstico: nombre compañía, contacto (nombre + cargo + email)
- Opción siempre disponible: preguntas base genéricas O contextualizar con IA (vertical + contexto + búsqueda web sobre la compañía)
- Revisar y editar preguntas antes de activar
- Activar → envía email al contacto con link de participación
- Marcar completado → envía email con link de resultados

### 2. Participantes `/d/[codigo]`
- Acceso público vía link
- Primera pantalla: selección de rol (A/B/C/D) con explicación clara
- Preguntas en secuencia por dimensión, escala 1–10
- Sin login, sesión anónima

### 3. Resultados `/r/[codigo]`
- Acceso público vía link
- Dashboard con:
  - Dot plot por dimensión (4 puntos = 4 roles, escala 1–10)
  - Delta (brecha máxima) por dimensión
  - Radar chart de los 4 roles
  - Tabla resumen

## Filosofía de diseño
- Paleta: fondo crema cálido, tipografía serif para títulos, sans para cuerpo
- Mínimo, claro, profesional — que proyecte la identidad de Laborativo
- Colores fijos por rol: Equipo=azul (#4A7FA5), Líder→Eq.=oliva (#8B7355), Eq.→Líder=vinotinto (#7D3C3C), Líder auto=verde oscuro (#3D6B4F)

## Convenciones de código
- Componentes en `src/components/[seccion]/NombreComponente.tsx`
- Server components por defecto, client components solo cuando se necesita interactividad
- Queries a Supabase siempre en server components o API routes
- Variables de entorno: `NEXT_PUBLIC_` solo para lo que va al cliente
