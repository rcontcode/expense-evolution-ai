

## Configurar evofinz.com en Hostinger → Paso a paso detallado

### Paso 1: Entrar al panel de Hostinger

1. Ve a **https://hpanel.hostinger.com** e inicia sesión
2. En el panel principal, busca tu dominio **evofinz.com** y haz clic en **"Administrar"** (o "Manage")

### Paso 2: Ir a la zona DNS

1. En el menú lateral izquierdo, busca la sección **"DNS / Nameservers"** o **"Zona DNS"**
2. Haz clic en **"DNS Records"** o **"Registros DNS"**
3. Verás una lista de registros existentes (A, CNAME, TXT, MX, etc.)

### Paso 3: Limpiar registros A antiguos

Antes de agregar los nuevos, **elimina** cualquier registro A existente que apunte a otra IP:

- Busca registros de tipo **A** con nombre **@** → haz clic en el ícono de basura/eliminar
- Busca registros de tipo **A** con nombre **www** → elimínalo también
- **No elimines** registros MX (correo) ni otros que no sean tipo A

### Paso 4: Crear registro A para el dominio raíz (@)

1. Haz clic en **"Añadir registro"** (o "Add Record")
2. Selecciona tipo: **A**
3. En **Nombre** (Name/Host): escribe **@**
4. En **Apunta a** (Points to / Value): escribe **185.158.133.1**
5. TTL: déjalo en **14400** (o el valor por defecto)
6. Haz clic en **"Añadir"** o **"Save"**

### Paso 5: Crear registro A para www

1. Haz clic en **"Añadir registro"** otra vez
2. Tipo: **A**
3. Nombre: **www**
4. Apunta a: **185.158.133.1**
5. TTL: **14400**
6. Guardar

### Paso 6: Crear registro TXT de verificación

1. Haz clic en **"Añadir registro"**
2. Tipo: **TXT**
3. Nombre: **_lovable**
4. Valor: el código que Lovable te da en Settings → Domains (algo como `lovable_verify=ABC123...`)
5. TTL: **14400**
6. Guardar

### Paso 7: Conectar el dominio en Lovable

1. En Lovable, ve a **Settings → Domains**
2. Haz clic en **"Connect Domain"**
3. Escribe **evofinz.com** y sigue las instrucciones — ahí verás el valor exacto del TXT que necesitas copiar a Hostinger
4. Repite para **www.evofinz.com**
5. Marca **evofinz.com** como dominio **Primary**

### Paso 8: Esperar propagación

- Los cambios DNS pueden tardar entre **15 minutos y 72 horas**
- Puedes verificar en **https://dnschecker.org** buscando `evofinz.com` tipo A → debe mostrar `185.158.133.1`
- Una vez verificado, Lovable provisiona SSL automáticamente (HTTPS)

### Resumen visual de registros DNS finales en Hostinger

```text
Tipo  | Nombre    | Valor                        | TTL
------+-----------+------------------------------+------
A     | @         | 185.158.133.1                | 14400
A     | www       | 185.158.133.1                | 14400
TXT   | _lovable  | lovable_verify=XXXXXXXX      | 14400
```

### Importante

- **No uses proxy/CDN de Hostinger** (si te ofrece activar algún proxy o acelerador, déjalo desactivado)
- Si Hostinger tiene **Nameservers personalizados** configurados (como Cloudflare), los registros DNS se deben hacer en ese otro panel, no en Hostinger
- Si ya tenías el dominio apuntando a un hosting web en Hostinger, al cambiar los registros A dejarás de usar ese hosting — el sitio se servirá desde Lovable

