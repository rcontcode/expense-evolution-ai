

# Explicación del Plan: Ronda 5 — Limpieza Final de Datos

## ¿Qué es este plan?

Es la **última ronda de limpieza técnica** después de 4 rondas anteriores donde se corrigieron problemas de seguridad (escalamiento de privilegios, RLS), tablas fantasma, y consistencia de datos. Esta ronda se enfoca en **pulir el código** — no cambia funcionalidad visible para el usuario.

---

## ¿Qué corrige exactamente?

### 1. Eliminar `as any` innecesarios (11 casos en 5 archivos)

**¿Qué es `as any`?** Es una instrucción en el código que dice "ignora el sistema de verificación de tipos". Se usaba como parche temporal cuando las tablas de la base de datos no estaban registradas en el sistema de tipos.

**El problema**: Esas tablas YA están registradas. Los `as any` restantes son residuos de versiones anteriores. No causan errores visibles, pero:
- Desactivan la verificación automática de errores de escritura (si escribes `snoozd_until` en vez de `snoozed_until`, no te avisa)
- Hacen el código más difícil de mantener

**Riesgo de aplicar este cambio**: Prácticamente nulo. Solo se quita el "as any" y TypeScript valida que los campos son correctos. Si algún campo NO coincidiera, el build fallaría y lo corregiríamos antes de publicar.

### 2. Cascade safety en la papelera (borrado permanente)

**El problema actual**: Cuando eliminas permanentemente un gasto desde la papelera, se borra el gasto pero quedan "fantasmas" en tablas relacionadas:
- Las etiquetas del gasto (`expense_tags`) quedan huérfanas
- Los documentos adjuntos (`documents`) quedan huérfanos
- No se registra quién borró qué en el historial de auditoría

**Lo que se corrige**: Antes de borrar un gasto permanentemente, se limpian sus etiquetas y documentos, y se registra la acción.

**Riesgo**: Bajo. Agrega pasos de limpieza ANTES del borrado. Si alguno falla, el borrado no procede (protección natural de la secuencia).

### 3. Verificar columna `voice_requests_count`

**El problema**: En la ronda anterior se creó esta columna en la base de datos. Solo hay que confirmar que el código la lee correctamente.

**Riesgo**: Ninguno — es solo verificación.

---

## ¿Hay consecuencias negativas?

| Aspecto | Riesgo | Detalle |
|---------|--------|---------|
| Funcionalidad visible | Ninguno | No cambia nada que el usuario vea |
| Rendimiento | Ninguno | No agrega queries pesadas |
| Borrado permanente | Mínimo positivo | Ahora tarda ~100ms más porque limpia dependencias primero, pero evita datos huérfanos |
| Build / compilación | Muy bajo | Si algún campo no coincide con el schema, TypeScript lo detecta y se corrige antes de publicar |
| Base de datos | Ninguno | No se modifican tablas ni políticas |

**En resumen**: Este plan tiene **cero riesgo funcional** y **mejora la calidad del código**. Es mantenimiento preventivo — como cambiar el aceite del motor.

---

## Recomendación

Aprobar tal cual. Son cambios conservadores de limpieza que no afectan la experiencia del usuario pero reducen la deuda técnica acumulada en las 4 rondas anteriores.

