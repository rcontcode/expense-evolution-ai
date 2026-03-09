
### 📌 Plan: Creación de Webhook para Recepción de Leads Externos

He analizado tu solicitud y la estructura de tu JSON. Para recibir estos leads en el CRM de EvoFinz, la mejor estrategia es crear un punto de acceso (Webhook) dedicado. 

Esto es lo que implementaré:

**1. Nueva Edge Function (`webhook-leads`)**
Crearé una función serverless optimizada para recibir el POST de TrustlyConnect. Esta función se encargará de:
*   **Mapeo de Datos:** Tomará tu JSON (con `score`, `level`, `source`, etc.) y lo adaptará a la estructura interna de la base de datos de EvoFinz (`quiz_leads`).
*   **Gestión de Valores Nulos:** Asignará valores por defecto o vacíos a campos que EvoFinz espera pero que TrustlyConnect no envía (como `country` o `failed_questions`).
*   **Priorización Automática:** Reutilizará el algoritmo interno de "Lead Scoring" del CRM para asignar automáticamente etiquetas como "HOT", "WARM" o "COLD" basándose en el `score` que envíes.

**2. Actualización de Configuración**
Actualizaré el archivo `supabase/config.toml` para añadir esta nueva función y configurarla como una API pública (`verify_jwt = false`), de forma que TrustlyConnect pueda hacer POST directamente sin bloqueos de autenticación de usuario.

**3. Entregables**
Una vez finalizada la implementación, te entregaré:
*   La URL completa del Webhook (que tendrá el formato `https://oxrfslyuzcgxacomgzgw.supabase.co/functions/v1/webhook-leads`).
*   Un ejemplo de cómo realizar la llamada `fetch` / `cURL` para que puedas probarla inmediatamente.

¿Estás de acuerdo con avanzar con esta implementación?
