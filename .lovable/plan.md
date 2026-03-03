

## Fix: Submenús del Sidebar Desktop No Funcionan con Hash Links

### Problema
El click handler de los submenús en el **sidebar desktop expandido** (líneas 1037-1042 de `Layout.tsx`) **no maneja rutas con hash** (`/dashboard#timeline`, `/analytics#predictions`, etc.). Solo tiene lógica para rutas con `?` query params y navegación simple.

Las versiones **mobile** (línea 648) y **tooltip colapsado** (línea 1076) sí lo manejan correctamente — falta replicar esa misma lógica aquí.

### Corrección
En `src/components/Layout.tsx`, líneas 1037-1042, reemplazar el `onClick` handler del submenu desktop expandido para incluir la lógica de hash, idéntica a la que ya funciona en mobile y tooltip:

```typescript
onClick={() => {
  const hashIndex = child.path.indexOf('#');
  if (hashIndex !== -1) {
    const basePath = child.path.substring(0, hashIndex);
    const hash = child.path.substring(hashIndex + 1);
    navigate(basePath);
    setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  } else if (child.path.startsWith('/dashboard?')) {
    window.location.href = child.path;
  } else {
    navigate(child.path);
  }
}}
```

### Archivo afectado
- `src/components/Layout.tsx` — solo el bloque onClick en líneas 1037-1042

