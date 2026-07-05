import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Code, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  language: string;
}

const WEBHOOK_URL = `https://oxrfslyuzcgxacomgzgw.supabase.co/functions/v1/webhook-leads`;

const CURL_SNIPPET = `curl -X POST '${WEBHOOK_URL}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-leads-secret: <LEADS_WEBHOOK_SHARED_SECRET>' \\
  -d '{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+56912345678",
  "source": "mi-landing-page",
  "quiz_answers": {
    "interest": "inversiones",
    "budget": "50000"
  }
}'`;

const JS_SNIPPET = `// JavaScript / Node.js
const response = await fetch('${WEBHOOK_URL}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-leads-secret': process.env.LEADS_WEBHOOK_SHARED_SECRET, // never hardcode
  },
  body: JSON.stringify({
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '+56912345678',
    source: 'mi-landing-page',
    quiz_answers: {
      interest: 'inversiones',
      budget: '50000'
    }
  })
});

const data = await response.json();
console.log('Lead created:', data);`;

const HTML_SNIPPET = `<!-- HTML Form Example -->
<!--
  ⚠️  Never embed LEADS_WEBHOOK_SHARED_SECRET in browser code.
  Post from a server (or an edge/proxy function that adds the header).
-->
<form id="leadForm">
  <input name="name" placeholder="Nombre" required />
  <input name="email" type="email" placeholder="Email" required />
  <input name="phone" placeholder="Teléfono" />
  <button type="submit">Enviar</button>
</form>

<script>
document.getElementById('leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);

  // Proxy this request through your backend so the secret stays server-side.
  await fetch('/api/submit-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: form.get('name'),
      email: form.get('email'),
      phone: form.get('phone'),
      source: 'mi-landing',
    })
  });

  alert('¡Gracias!');
});
</script>`;


export const AdminWebhookSnippet = ({ language }: Props) => {
  const isEs = language === 'es';
  const [copied, setCopied] = useState<string | null>(null);
  const [activeSnippet, setActiveSnippet] = useState<'curl' | 'js' | 'html'>('curl');

  const snippets = { curl: CURL_SNIPPET, js: JS_SNIPPET, html: HTML_SNIPPET };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success(isEs ? '¡Copiado!' : 'Copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Endpoint */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-blue-400" />
            Webhook Endpoint
          </CardTitle>
          <CardDescription className="text-xs">
            {isEs 
              ? 'Envía leads desde cualquier landing page, formulario o integración externa' 
              : 'Send leads from any landing page, form, or external integration'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs font-mono break-all">
              POST {WEBHOOK_URL}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy('url', WEBHOOK_URL)}
              className="shrink-0 h-8"
            >
              {copied === 'url' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Required fields */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{isEs ? 'Campos del payload' : 'Payload Fields'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/30">required</Badge>
              <code className="font-mono">email</code> — {isEs ? 'Email del lead' : 'Lead email'}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/30">optional</Badge>
              <code className="font-mono">name</code> — {isEs ? 'Nombre completo' : 'Full name'}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/30">optional</Badge>
              <code className="font-mono">phone</code> — {isEs ? 'Teléfono' : 'Phone number'}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/30">optional</Badge>
              <code className="font-mono">source</code> — {isEs ? 'Fuente del lead (ej: "fokuspark", "mi-landing")' : 'Lead source (e.g. "fokuspark", "my-landing")'}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/30">optional</Badge>
              <code className="font-mono">quiz_answers</code> — {isEs ? 'Respuestas del cuestionario (objeto JSON)' : 'Quiz answers (JSON object)'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Snippets */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="h-4 w-4 text-purple-400" />
              {isEs ? 'Ejemplos de integración' : 'Integration Examples'}
            </CardTitle>
            <div className="flex gap-1">
              {(['curl', 'js', 'html'] as const).map(key => (
                <Button
                  key={key}
                  size="sm"
                  variant={activeSnippet === key ? 'default' : 'outline'}
                  onClick={() => setActiveSnippet(key)}
                  className="text-[10px] h-6 px-2"
                >
                  {key === 'curl' ? 'cURL' : key === 'js' ? 'JavaScript' : 'HTML Form'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-muted/50 rounded-lg p-3 text-[11px] font-mono overflow-x-auto max-h-[300px] whitespace-pre-wrap">
              {snippets[activeSnippet]}
            </pre>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(activeSnippet, snippets[activeSnippet])}
              className="absolute top-2 right-2 h-7 text-xs"
            >
              {copied === activeSnippet ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {isEs ? 'Copiar' : 'Copy'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
