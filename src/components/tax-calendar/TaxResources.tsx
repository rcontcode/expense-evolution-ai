import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, FileText, Calculator, BookOpen, Phone, Globe, Building2, User, Briefcase, AlertTriangle } from "lucide-react";

interface TaxResourcesProps {
  language: string;
  country?: string;
}

export function TaxResources({ language, country = 'CA' }: TaxResourcesProps) {
  const isEs = language === 'es';
  const isChile = country === 'CL';

  // Chile Resources
  if (isChile) {
    const chileResources = [
      {
        category: "Formularios SII",
        icon: <FileText className="h-5 w-5" />,
        items: [
          {
            name: "Formulario 22",
            description: "Declaración Anual de Impuesto a la Renta",
            url: "https://www.sii.cl/servicios_online/1047-declaracion_de_renta-1182.html",
            badge: "Anual"
          },
          {
            name: "Formulario 29",
            description: "Declaración Mensual IVA y PPM",
            url: "https://www.sii.cl/servicios_online/1047-formulario_29-1156.html",
            badge: "Mensual"
          },
          {
            name: "Boleta Electrónica",
            description: "Emitir boletas de honorarios electrónicas",
            url: "https://www.sii.cl/servicios_online/1040-boleta_honorarios-1042.html",
            badge: "Honorarios"
          },
          {
            name: "Factura Electrónica",
            description: "Emitir facturas afectas y exentas",
            url: "https://www.sii.cl/servicios_online/1039-factura_electronica-1040.html",
            badge: "Empresas"
          }
        ]
      },
      {
        category: "Herramientas SII",
        icon: <Calculator className="h-5 w-5" />,
        items: [
          {
            name: "Mi SII",
            description: "Portal personal del contribuyente",
            url: "https://www.sii.cl/servicios_online/mi_sii.html",
            badge: "Portal"
          },
          {
            name: "Consulta Situación Tributaria",
            description: "Verifica tu estado ante el SII",
            url: "https://www.sii.cl/servicios_online/1047-consulta_situacion_tributaria-1260.html",
            badge: "Consulta"
          },
          {
            name: "Calculadora de UF/UTM",
            description: "Valores actualizados e históricos",
            url: "https://www.sii.cl/valores_y_fechas/uf/uf2024.htm",
            badge: "Gratis"
          },
          {
            name: "Propuesta de Declaración",
            description: "Ver tu propuesta F22 preparada por el SII",
            url: "https://www.sii.cl/servicios_online/1047-propuesta_declaracion-1314.html",
            badge: "F22"
          }
        ]
      },
      {
        category: "Guías y Normativas",
        icon: <BookOpen className="h-5 w-5" />,
        items: [
          {
            name: "Inicio de Actividades",
            description: "Cómo iniciar actividades comerciales",
            url: "https://www.sii.cl/servicios_online/1047-inicio_actividades-1043.html",
            badge: "Guía"
          },
          {
            name: "Regímenes Tributarios",
            description: "Pro PyME, General, 14D",
            url: "https://www.sii.cl/destacados/mipyme/index.html",
            badge: "PyME"
          },
          {
            name: "Gastos Deducibles",
            description: "Qué gastos puedes rebajar",
            url: "https://www.sii.cl/preguntas_frecuentes/renta/001_002_3203.htm",
            badge: "Guía"
          },
          {
            name: "APV - Ahorro Previsional",
            description: "Beneficios tributarios del APV",
            url: "https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-10377.html",
            badge: "Ahorro"
          }
        ]
      },
      {
        category: "Contacto SII",
        icon: <Phone className="h-5 w-5" />,
        items: [
          {
            name: "Call Center SII",
            description: "600 748 2960 (desde Chile)",
            url: "tel:+566007482960",
            badge: "Teléfono"
          },
          {
            name: "Oficinas SII",
            description: "Ubicación de oficinas a nivel nacional",
            url: "https://www.sii.cl/sobre_el_sii/oficinas_sii.html",
            badge: "Presencial"
          },
          {
            name: "Consultas en línea",
            description: "Sistema de consultas virtuales",
            url: "https://www.sii.cl/servicios_online/consultas.html",
            badge: "Online"
          }
        ]
      }
    ];

    return (
      <div className="space-y-6">
        {/* Quick Links Chile */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent cursor-pointer hover:border-blue-500/50 transition-all">
            <a href="https://www.sii.cl/servicios_online/mi_sii.html" target="_blank" rel="noopener">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">Mi SII</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Accede a tu portal del contribuyente
                </p>
              </CardContent>
            </a>
          </Card>

          <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent cursor-pointer hover:border-green-500/50 transition-all">
            <a href="https://www.sii.cl/servicios_online/1047-formulario_29-1156.html" target="_blank" rel="noopener">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-base">F29</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Declaración mensual IVA/PPM
                </p>
              </CardContent>
            </a>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:border-amber-500/50 transition-all">
            <a href="https://www.sii.cl/servicios_online/1040-boleta_honorarios-1042.html" target="_blank" rel="noopener">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base">Boletas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Emitir boletas de honorarios
                </p>
              </CardContent>
            </a>
          </Card>
        </div>

        {/* Resource Categories */}
        {chileResources.map((category, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.icon}
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {category.items.map((item, itemIdx) => (
                  <a 
                    key={itemIdx}
                    href={item.url}
                    target="_blank"
                    rel="noopener"
                    className="p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium group-hover:text-primary transition-colors">
                            {item.name}
                          </p>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{item.badge}</Badge>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Disclaimer Chile */}
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Aviso Legal Importante</AlertTitle>
          <AlertDescription className="text-sm space-y-2">
            <p>
              <strong>⚠️ Esta información es solo para referencia general.</strong>
            </p>
            <p>
              Las normas tributarias chilenas cambian frecuentemente. Esta aplicación no constituye 
              asesoría tributaria profesional. Consulta siempre con un contador autorizado o 
              directamente con el Servicio de Impuestos Internos (SII) para tu situación específica.
            </p>
            <p className="text-xs text-muted-foreground">
              EvoFinz no se hace responsable por decisiones tributarias tomadas basándose únicamente 
              en la información proporcionada en esta aplicación.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Canada Resources (original)
  const resources = [
    {
      category: isEs ? "Formularios CRA" : "CRA Forms",
      icon: <FileText className="h-5 w-5" />,
      items: [
        {
          name: "T1 General",
          description: isEs ? "Declaración personal de impuestos" : "Personal income tax return",
          url: "https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package.html",
          badge: isEs ? "Personal" : "Personal"
        },
        {
          name: "T2125",
          description: isEs ? "Estado de actividades de negocio o profesionales" : "Statement of business or professional activities",
          url: "https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html",
          badge: isEs ? "Autónomo" : "Self-Employed"
        },
        {
          name: "T2",
          description: isEs ? "Declaración de impuestos corporativos" : "Corporation income tax return",
          url: "https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2.html",
          badge: isEs ? "Corporación" : "Corporation"
        },
        {
          name: "GST34",
          description: isEs ? "Declaración GST/HST" : "GST/HST return",
          url: "https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/gst34.html",
          badge: "GST/HST"
        }
      ]
    },
    {
      category: isEs ? "Calculadoras CRA" : "CRA Calculators",
      icon: <Calculator className="h-5 w-5" />,
      items: [
        {
          name: isEs ? "Calculadora de impuestos personales" : "Personal Tax Calculator",
          description: isEs ? "Estima tu retorno de impuestos" : "Estimate your tax return",
          url: "https://www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/netfile-overview/certified-software-netfile-program.html",
          badge: isEs ? "Gratis" : "Free"
        },
        {
          name: isEs ? "Calculadora de beneficios" : "Benefits Calculator",
          description: isEs ? "Calcula tus beneficios elegibles" : "Calculate your eligible benefits",
          url: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/child-family-benefits-calculator.html",
          badge: isEs ? "Gratis" : "Free"
        },
        {
          name: isEs ? "Calculadora RRSP" : "RRSP Calculator",
          description: isEs ? "Planifica tus contribuciones RRSP" : "Plan your RRSP contributions",
          url: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-rrsp-prpp.html",
          badge: "RRSP"
        }
      ]
    },
    {
      category: isEs ? "Cuentas CRA" : "CRA Accounts",
      icon: <Globe className="h-5 w-5" />,
      items: [
        {
          name: "My Account",
          description: isEs ? "Portal personal de CRA" : "Personal CRA portal",
          url: "https://www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html",
          badge: isEs ? "Personal" : "Personal"
        },
        {
          name: "My Business Account",
          description: isEs ? "Portal de negocios de CRA" : "Business CRA portal",
          url: "https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html",
          badge: isEs ? "Negocio" : "Business"
        },
        {
          name: "Represent a Client",
          description: isEs ? "Para contadores y representantes" : "For accountants and representatives",
          url: "https://www.canada.ca/en/revenue-agency/services/e-services/represent-a-client.html",
          badge: isEs ? "Contador" : "Accountant"
        }
      ]
    },
    {
      category: isEs ? "Guías y Tutoriales" : "Guides & Tutorials",
      icon: <BookOpen className="h-5 w-5" />,
      items: [
        {
          name: isEs ? "Guía para nuevos negocios" : "New Business Guide",
          description: isEs ? "Cómo registrar y operar tu negocio" : "How to register and operate your business",
          url: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/small-businesses-self-employed-income.html",
          badge: isEs ? "Guía" : "Guide"
        },
        {
          name: isEs ? "Registro GST/HST" : "GST/HST Registration",
          description: isEs ? "Cuándo y cómo registrarse" : "When and how to register",
          url: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/register-gst-hst.html",
          badge: "GST/HST"
        },
        {
          name: isEs ? "Deducciones de negocio" : "Business Deductions",
          description: isEs ? "Qué gastos puedes deducir" : "What expenses you can deduct",
          url: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/business-expenses.html",
          badge: isEs ? "Guía" : "Guide"
        },
        {
          name: isEs ? "Kilometraje CRA 2024" : "CRA Mileage 2024",
          description: isEs ? "Tasas de kilometraje deducible" : "Deductible mileage rates",
          url: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/benefits-allowances/automobile/automobile-motor-vehicle-allowances/automobile-allowance-rates.html",
          badge: "2024"
        }
      ]
    },
    {
      category: isEs ? "Contacto CRA" : "Contact CRA",
      icon: <Phone className="h-5 w-5" />,
      items: [
        {
          name: isEs ? "Línea de impuestos personales" : "Personal Tax Line",
          description: "1-800-959-8281",
          url: "tel:1-800-959-8281",
          badge: isEs ? "Teléfono" : "Phone"
        },
        {
          name: isEs ? "Línea de negocios" : "Business Line",
          description: "1-800-959-5525",
          url: "tel:1-800-959-5525",
          badge: isEs ? "Teléfono" : "Phone"
        },
        {
          name: isEs ? "Línea GST/HST" : "GST/HST Line",
          description: "1-800-959-5525",
          url: "tel:1-800-959-5525",
          badge: "GST/HST"
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent cursor-pointer hover:border-blue-500/50 transition-all">
          <a href="https://www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html" target="_blank" rel="noopener">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">My Account</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {isEs ? "Accede a tu cuenta personal CRA" : "Access your personal CRA account"}
              </p>
            </CardContent>
          </a>
        </Card>

        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent cursor-pointer hover:border-purple-500/50 transition-all">
          <a href="https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html" target="_blank" rel="noopener">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-base">My Business Account</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {isEs ? "Gestiona tu cuenta de negocios" : "Manage your business account"}
              </p>
            </CardContent>
          </a>
        </Card>

        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:border-amber-500/50 transition-all">
          <a href="https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html" target="_blank" rel="noopener">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base">T2125</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {isEs ? "Formulario para autónomos" : "Self-employed form"}
              </p>
            </CardContent>
          </a>
        </Card>
      </div>

      {/* Resource Categories */}
      {resources.map((category, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {category.icon}
              {category.category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {category.items.map((item, itemIdx) => (
                <a 
                  key={itemIdx}
                  href={item.url}
                  target="_blank"
                  rel="noopener"
                  className="p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {item.name}
                        </p>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{item.badge}</Badge>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Disclaimer */}
      <Alert className="border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-500">
          {isEs ? "Aviso Legal Importante" : "Important Legal Notice"}
        </AlertTitle>
        <AlertDescription className="text-sm space-y-2">
          <p>
            <strong>⚠️ {isEs ? "Esta información es solo para referencia general." : "This information is for general reference only."}</strong>
          </p>
          <p>
            {isEs 
              ? "Las leyes fiscales cambian frecuentemente. Esta aplicación no constituye asesoría fiscal profesional. Consulta siempre con un contador certificado o la CRA directamente para tu situación específica."
              : "Tax laws change frequently. This application does not constitute professional tax advice. Always consult with a certified accountant or CRA directly for your specific situation."
            }
          </p>
          <p className="text-xs text-muted-foreground">
            {isEs
              ? "EvoFinz no se hace responsable por decisiones fiscales tomadas basándose únicamente en la información proporcionada en esta aplicación."
              : "EvoFinz is not responsible for tax decisions made based solely on the information provided in this application."
            }
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}