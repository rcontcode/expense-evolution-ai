

# Plan: Centro de Avisos Completo - Alertas Inteligentes en Tiempo Real

## Problema Actual
El Centro de Avisos solo muestra dos tipos de informacion: (1) el prompt de completitud de gastos y (2) notificaciones de la base de datos. Pero la app ya tiene muchos datos que podrian generar avisos utiles que el usuario nunca ve en este panel.

## Nuevos Tipos de Avisos a Agregar

Se integraran **7 nuevas categorias de avisos inteligentes** que se calculan en tiempo real a partir de los datos existentes del usuario, sin necesidad de cambios en la base de datos:

### 1. Documentos Pendientes de Revision
- Usa `useDocumentsForReview` (ya existe)
- Muestra: "Tienes X documentos pendientes de clasificar"
- Accion: Ir a /documents
- Icono: FileText, color violeta

### 2. Gastos Incompletos (sin categoria o proveedor)
- Usa `useNudgeSystem` / `useExpenses` (ya existe)
- Muestra: "X gastos sin categoria o proveedor"
- Accion: Ir a /expenses
- Icono: AlertTriangle, color naranja

### 3. Cuentas por Pagar Vencidas / Proximas
- Usa `useRecurringBills` (ya existe)
- Detecta facturas cuya `next_due_date` ya paso o esta dentro de 3 dias
- Muestra: "Tienes X cuentas vencidas" o "X cuentas vencen pronto"
- Accion: Ir a /bills
- Icono: CreditCard, color rojo

### 4. Metas de Ahorro con Fecha Limite Cercana
- Usa `useSavingsGoals` (ya existe)
- Detecta metas activas cuyo `deadline` esta dentro de 30 dias y el progreso es < 80%
- Muestra: "Meta 'X' vence en Y dias y vas al Z%"
- Accion: Ir a /goals
- Icono: Target, color amber

### 5. Problemas de Integridad de Datos (Data Health)
- Usa `useDataHealthCheck` (ya existe)
- Muestra: "Se detectaron X problemas en tus datos"
- Accion: Ir a /expenses
- Icono: Shield, color rojo

### 6. Sin Ingresos Registrados
- Detecta si hay gastos pero cero ingresos en el mes actual
- Muestra: "No has registrado ingresos este mes"
- Accion: Ir a /income
- Icono: TrendingUp, color azul

### 7. Sin Clientes Registrados (Onboarding)
- Detecta si no hay clientes creados
- Muestra: "Agrega tu primer cliente para desbloquear facturacion"
- Accion: Ir a /clients
- Icono: Users, color indigo

## Cambios Tecnicos

### Archivo modificado: `src/components/dashboard/DashboardNotificationHub.tsx`

1. Importar los hooks necesarios: `useNudgeSystem`, `useDataHealthCheck`, `useRecurringBills`, `useSavingsGoals`, `useDocumentsForReview`

2. Crear una interfaz `SmartAlert` local con campos: `id`, `icon`, `iconEmoji`, `title`, `message`, `actionUrl`, `color`, `priority`, `dismissKey`

3. Computar via `useMemo` un array `smartAlerts` que evalua cada condicion:
   - Documentos pendientes > 0
   - Gastos incompletos > 0
   - Cuentas vencidas/proximas
   - Metas en riesgo
   - Problemas de integridad
   - Sin ingresos
   - Sin clientes

4. Agregar estado local `dismissedAlerts` (Set de dismissKey) con persistencia en `localStorage` y cooldown de 24h

5. Combinar `smartAlerts` filtrados + `notifications` de DB en el conteo de `totalItems`

6. Renderizar los smart alerts entre el prompt de completitud y las notificaciones de DB, usando el mismo estilo de fila pero con iconos/colores especificos por tipo

7. Cada smart alert tendra: boton de accion (navegar) y boton de dismiss (X)

### Sin cambios en base de datos
Todos los datos necesarios ya existen. Los avisos se calculan client-side en tiempo real.

