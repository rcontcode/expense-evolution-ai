
# Plan: Transformacion Completa de Captura Movil

## Resumen Ejecutivo

Transformaremos la pantalla de **Captura Movil** (`/mobile-capture`) en una experiencia vibrante, gamificada y con funcionalidades profesionales. El objetivo es que capturar recibos sea satisfactorio, eficiente y visualmente atractivo.

---

## Fase 1: Rediseno Visual Completo

### 1.1 Header con Gradiente Animado
- Fondo con gradiente animado (primary -> accent)
- Icono de camara con efecto "glow" pulsante
- Badge de estado online/offline con colores vibrantes y animacion

### 1.2 Area de Captura Colorida
- Borde con gradiente animado de 3 colores (azul -> verde -> purpura)
- Efecto "shimmer" brillante cuando esta listo para capturar
- Patron de puntos sutiles en el fondo
- Icono de camara 3D con sombra y animacion de rebote

### 1.3 Animacion de Escaneo Laser
- Durante el procesamiento, una linea laser horizontal animada cruza la imagen
- Efecto de brillo/glow siguiendo la linea
- Particulas flotando durante el analisis

### 1.4 Tarjeta de Estadisticas Gamificada
- Gradiente de fondo dinamico segun cantidad (verde = muchos, amarillo = pocos)
- Iconos animados (trofeo, estrella, fuego para racha)
- Barra de progreso hacia meta diaria
- Celebracion visual con confetti al alcanzar metas (5, 10, 20 recibos)
- Contador de racha de dias consecutivos

### 1.5 Botones con Vida
- Boton "Procesar" con gradiente primary -> success
- Efecto de escala y glow en hover
- Animacion de particulas/confetti cuando se procesa exitosamente
- Boton "Retomar" con borde colorido outline

---

## Fase 2: Panel de Edicion Rapida Post-Captura

### 2.1 Nuevo Componente QuickEditPanel
Despues de procesar exitosamente un recibo, mostramos inmediatamente los datos extraidos con opciones de edicion rapida:

```text
+-----------------------------------------------+
|  GASTO DETECTADO!                       [x]  |
+-----------------------------------------------+
|  Costco Wholesale          $156.78 CAD       |
|  Supermercado       2024-02-01               |
+-----------------------------------------------+
|  [Cliente v]  [Proyecto v]  [Categoria v]    |
+-----------------------------------------------+
|  [ Editar mas ]        [ Otro recibo ]  [ OK ]|
+-----------------------------------------------+
```

Funcionalidades:
- Selector rapido de Cliente (dropdown)
- Selector rapido de Proyecto (dropdown)
- Selector rapido de Categoria (chips coloridos)
- Boton "Guardar y Capturar Otro" para flujo continuo
- Animacion de entrada/salida suave

---

## Fase 3: Modo Offline con Cola Inteligente

### 3.1 Sistema de Cola Local
- Guardar fotos en IndexedDB cuando no hay conexion
- Indicador visual de cola pendiente (badge con numero)
- Sincronizacion automatica al reconectar

### 3.2 Interfaz de Cola
- Lista deslizable de fotos pendientes
- Estado de cada foto (pendiente/sincronizando/error)
- Opcion de reintentar o eliminar individualmente

### 3.3 Notificaciones
- Toast cuando se detecta reconexion
- Progreso de sincronizacion visible
- Celebracion cuando la cola se vacia

---

## Fase 4: Widgets de Productividad y Gamificacion

### 4.1 Meta Diaria
- Configurar meta de recibos por dia (default: 5)
- Barra de progreso circular animada
- Felicitacion al completar meta

### 4.2 Sistema de Rachas
- Contador de dias consecutivos capturando
- Icono de fuego que crece con la racha
- Bonificacion XP por mantener rachas

### 4.3 Logros Rapidos
- "Primera captura del dia" 
- "5 recibos en una sesion"
- "Captura perfecta" (alta confianza OCR)

---

## Fase 5: Mejoras de Captura/OCR

### 5.1 Guias de Encuadre
- Marco visual que ayuda a centrar el recibo
- Esquinas animadas que se iluminan cuando detecta bordes

### 5.2 Indicadores de Calidad
- Indicador de iluminacion (muy oscuro/muy brillante)
- Indicador de enfoque (borroso/nitido)
- Recomendaciones en tiempo real

### 5.3 Acceso a Camara Continua
- Boton para abrir ContinuousCameraDialog existente
- Integracion con historial de sesiones

---

## Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/pages/MobileCapture.tsx` | Modificar | Rediseno visual completo, nuevos estados, animaciones |
| `src/components/capture/QuickEditPanel.tsx` | Crear | Panel de edicion rapida post-captura |
| `src/components/capture/MobileCaptureStats.tsx` | Crear | Estadisticas gamificadas con metas y rachas |
| `src/components/capture/OfflineQueue.tsx` | Crear | Sistema de cola offline con UI |
| `src/components/capture/CaptureGuideOverlay.tsx` | Crear | Guias de encuadre y calidad |
| `src/hooks/data/useOfflineQueue.ts` | Crear | Hook para manejar cola IndexedDB |
| `src/hooks/data/useCaptureStreak.ts` | Crear | Hook para rastrear rachas de captura |

---

## Detalles Tecnicos

### Animaciones CSS Nuevas
```css
/* Gradiente animado para borde */
@keyframes gradient-border {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Linea laser de escaneo */
@keyframes laser-scan {
  0% { top: 0%; opacity: 1; }
  100% { top: 100%; opacity: 0.5; }
}

/* Efecto shimmer */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Estructura de Cola Offline
```typescript
interface OfflineQueueItem {
  id: string;
  blob: Blob;
  timestamp: Date;
  status: 'pending' | 'syncing' | 'error';
  retryCount: number;
  metadata?: {
    quickCategory?: string;
    quickClient?: string;
  };
}
```

### Estructura de Racha
```typescript
interface CaptureStreak {
  currentStreak: number;
  longestStreak: number;
  lastCaptureDate: string;
  todayCount: number;
  dailyGoal: number;
}
```

---

## Orden de Implementacion

1. **Fase 1** - Colores y animaciones (MobileCapture.tsx + CSS)
2. **Fase 2** - QuickEditPanel (nuevo componente)
3. **Fase 4** - Estadisticas gamificadas (MobileCaptureStats + useCaptureStreak)
4. **Fase 3** - Modo offline (OfflineQueue + useOfflineQueue)
5. **Fase 5** - Guias de captura (CaptureGuideOverlay)

---

## Vista Previa del Resultado

La nueva pantalla tendra:
- Header vibrante con gradiente animado
- Area de captura con bordes multicolor brillantes
- Animacion de escaneo laser durante el procesamiento
- Confetti y celebraciones al guardar exitosamente
- Panel de edicion rapida con los datos extraidos
- Barra de progreso hacia meta diaria
- Indicador de racha de dias
- Cola offline visible con estado de sincronizacion
- Guias visuales para mejor encuadre

Todo respetando el sistema de temas existente (light/dark) y las convenciones de la aplicacion.
