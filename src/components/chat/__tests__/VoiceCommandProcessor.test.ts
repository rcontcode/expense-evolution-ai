import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the voice command processing logic
describe("Voice Command Processor", () => {
  describe("Command Type Detection", () => {
    const detectCommandType = (text: string): string => {
      const lower = text.toLowerCase();
      
      // Tutorial detection FIRST (before navigate, since "show me how" contains "show")
      if (lower.includes("tutorial") || lower.includes("enseñar") || lower.includes("mostrar cómo") ||
          lower.includes("teach") || lower.includes("show me how")) {
        return "tutorial";
      }
      
      if (lower.includes("agregar") || lower.includes("registrar") || lower.includes("crear") || 
          lower.includes("add") || lower.includes("create") || lower.includes("record")) {
        return "create";
      }
      
      if (lower.includes("ir a") || lower.includes("mostrar") || lower.includes("abrir") ||
          lower.includes("go to") || lower.includes("show") || lower.includes("open")) {
        return "navigate";
      }
      
      if (lower.includes("cuánto") || lower.includes("cuál") || lower.includes("cuántos") ||
          lower.includes("how much") || lower.includes("how many") || lower.includes("what is")) {
        return "query";
      }
      
      return "chat";
    };

    it("should detect create commands in Spanish", () => {
      expect(detectCommandType("agregar gasto")).toBe("create");
      expect(detectCommandType("registrar ingreso")).toBe("create");
      expect(detectCommandType("crear cliente")).toBe("create");
    });

    it("should detect create commands in English", () => {
      expect(detectCommandType("add expense")).toBe("create");
      expect(detectCommandType("record income")).toBe("create");
      expect(detectCommandType("create client")).toBe("create");
    });

    it("should detect navigation commands in Spanish", () => {
      expect(detectCommandType("ir a gastos")).toBe("navigate");
      expect(detectCommandType("mostrar ingresos")).toBe("navigate");
      expect(detectCommandType("abrir clientes")).toBe("navigate");
    });

    it("should detect navigation commands in English", () => {
      expect(detectCommandType("go to expenses")).toBe("navigate");
      expect(detectCommandType("show income")).toBe("navigate");
      expect(detectCommandType("open clients")).toBe("navigate");
    });

    it("should detect query commands in Spanish", () => {
      expect(detectCommandType("cuánto gasté")).toBe("query");
      expect(detectCommandType("cuál es mi balance")).toBe("query");
      expect(detectCommandType("cuántos clientes tengo")).toBe("query");
    });

    it("should detect query commands in English", () => {
      expect(detectCommandType("how much did I spend")).toBe("query");
      expect(detectCommandType("how many clients")).toBe("query");
      expect(detectCommandType("what is my balance")).toBe("query");
    });

    it("should detect tutorial commands", () => {
      expect(detectCommandType("iniciar tutorial")).toBe("tutorial");
      expect(detectCommandType("enseñar a usar")).toBe("tutorial");
      expect(detectCommandType("show me how to use")).toBe("tutorial");
    });

    it("should default to chat for unknown commands", () => {
      expect(detectCommandType("hola")).toBe("chat");
      expect(detectCommandType("hello")).toBe("chat");
      expect(detectCommandType("gracias")).toBe("chat");
    });
  });

  describe("Expense Parsing", () => {
    const parseExpenseCommand = (text: string): { amount?: number; category?: string; vendor?: string } => {
      const result: { amount?: number; category?: string; vendor?: string } = {};
      
      // Extract amount
      const amountMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:pesos?|dólares?|dollars?|€|\$)?/i);
      if (amountMatch) {
        result.amount = parseFloat(amountMatch[1].replace(',', '.'));
      }
      
      // Extract category keywords
      const categoryMap: Record<string, string> = {
        'comida': 'food',
        'restaurante': 'food',
        'almuerzo': 'food',
        'cena': 'food',
        'desayuno': 'food',
        'transporte': 'transport',
        'uber': 'transport',
        'taxi': 'transport',
        'gasolina': 'transport',
        'oficina': 'office',
        'software': 'software',
        'suscripción': 'subscriptions',
      };
      
      for (const [keyword, category] of Object.entries(categoryMap)) {
        if (text.toLowerCase().includes(keyword)) {
          result.category = category;
          break;
        }
      }
      
      return result;
    };

    it("should parse amount from expense command", () => {
      const result = parseExpenseCommand("agregar gasto de 50 pesos");
      expect(result.amount).toBe(50);
    });

    it("should parse amount with decimals", () => {
      const result = parseExpenseCommand("gasto de 123.45 dólares");
      expect(result.amount).toBe(123.45);
    });

    it("should parse category from keywords", () => {
      expect(parseExpenseCommand("gasto en restaurante").category).toBe("food");
      expect(parseExpenseCommand("gasto de uber").category).toBe("transport");
      expect(parseExpenseCommand("gasto en software").category).toBe("software");
    });

    it("should handle Spanish comma decimal separator", () => {
      const result = parseExpenseCommand("gasto de 99,50 euros");
      expect(result.amount).toBe(99.5);
    });
  });

  describe("Income Parsing", () => {
    const parseIncomeCommand = (text: string): { amount?: number; type?: string; source?: string } => {
      const result: { amount?: number; type?: string; source?: string } = {};
      
      // Extract amount
      const amountMatch = text.match(/(\d+(?:[.,]\d+)?)/);
      if (amountMatch) {
        result.amount = parseFloat(amountMatch[1].replace(',', '.'));
      }
      
      // Extract income type
      const typeMap: Record<string, string> = {
        'freelance': 'freelance',
        'salario': 'salary',
        'salary': 'salary',
        'cliente': 'client_payment',
        'client': 'client_payment',
        'inversión': 'investment',
        'investment': 'investment',
        'dividendo': 'dividend',
        'dividend': 'dividend',
      };
      
      for (const [keyword, type] of Object.entries(typeMap)) {
        if (text.toLowerCase().includes(keyword)) {
          result.type = type;
          break;
        }
      }
      
      return result;
    };

    it("should parse income amount", () => {
      const result = parseIncomeCommand("registrar ingreso de 5000");
      expect(result.amount).toBe(5000);
    });

    it("should parse income type from keywords", () => {
      expect(parseIncomeCommand("ingreso freelance").type).toBe("freelance");
      expect(parseIncomeCommand("salario recibido").type).toBe("salary");
      expect(parseIncomeCommand("pago de cliente").type).toBe("client_payment");
    });
  });

  describe("Navigation Target Detection", () => {
    const parseNavigationTarget = (text: string): string | null => {
      const lower = text.toLowerCase();
      
      const routeMap: Record<string, string> = {
        'dashboard': '/dashboard',
        'gastos': '/expenses',
        'expenses': '/expenses',
        'ingresos': '/income',
        'income': '/income',
        'clientes': '/clients',
        'clients': '/clients',
        'proyectos': '/projects',
        'projects': '/projects',
        'contratos': '/contracts',
        'contracts': '/contracts',
        'kilometraje': '/mileage',
        'mileage': '/mileage',
        'patrimonio': '/net-worth',
        'net worth': '/net-worth',
        'banco': '/banking',
        'banking': '/banking',
        'configuración': '/settings',
        'settings': '/settings',
      };
      
      for (const [keyword, route] of Object.entries(routeMap)) {
        if (lower.includes(keyword)) {
          return route;
        }
      }
      
      return null;
    };

    it("should detect Spanish navigation targets", () => {
      expect(parseNavigationTarget("ir a gastos")).toBe("/expenses");
      expect(parseNavigationTarget("mostrar ingresos")).toBe("/income");
      expect(parseNavigationTarget("abrir clientes")).toBe("/clients");
      expect(parseNavigationTarget("ver patrimonio")).toBe("/net-worth");
    });

    it("should detect English navigation targets", () => {
      expect(parseNavigationTarget("go to expenses")).toBe("/expenses");
      expect(parseNavigationTarget("show income")).toBe("/income");
      expect(parseNavigationTarget("open clients")).toBe("/clients");
      expect(parseNavigationTarget("view dashboard")).toBe("/dashboard");
    });

    it("should return null for unknown targets", () => {
      expect(parseNavigationTarget("ir a xyz")).toBeNull();
      expect(parseNavigationTarget("go to nowhere")).toBeNull();
    });
  });

  describe("Open Client Command Parsing", () => {
    const parseOpenClientCommand = (text: string): { clientName?: string } | null => {
      const patterns = [
        /abrir\s+(?:cliente|client)\s+(.+)/i,
        /open\s+(?:cliente|client)\s+(.+)/i,
        /(?:cliente|client)\s+(.+)/i,
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return { clientName: match[1].trim() };
        }
      }
      
      return null;
    };

    it("should parse Spanish open client command", () => {
      const result = parseOpenClientCommand("abrir cliente Acme Corp");
      expect(result?.clientName).toBe("Acme Corp");
    });

    it("should parse English open client command", () => {
      const result = parseOpenClientCommand("open client Test Company");
      expect(result?.clientName).toBe("Test Company");
    });

    it("should handle simple client mention", () => {
      const result = parseOpenClientCommand("cliente Juan");
      expect(result?.clientName).toBe("Juan");
    });
  });

  describe("Query Response Generation", () => {
    const generateQueryResponse = (
      queryType: string,
      data: { monthlyExpenses: number; monthlyIncome: number; clientCount: number },
      language: string
    ): string => {
      const templates = {
        es: {
          monthlyExpenses: `Has gastado $${data.monthlyExpenses.toLocaleString()} este mes.`,
          monthlyIncome: `Has recibido $${data.monthlyIncome.toLocaleString()} de ingresos este mes.`,
          balance: `Tu balance es de $${(data.monthlyIncome - data.monthlyExpenses).toLocaleString()}.`,
          clientCount: `Tienes ${data.clientCount} cliente${data.clientCount === 1 ? '' : 's'}.`,
        },
        en: {
          monthlyExpenses: `You spent $${data.monthlyExpenses.toLocaleString()} this month.`,
          monthlyIncome: `You received $${data.monthlyIncome.toLocaleString()} in income this month.`,
          balance: `Your balance is $${(data.monthlyIncome - data.monthlyExpenses).toLocaleString()}.`,
          clientCount: `You have ${data.clientCount} client${data.clientCount === 1 ? '' : 's'}.`,
        },
      };
      
      const lang = templates[language as keyof typeof templates] || templates.es;
      return lang[queryType as keyof typeof lang] || '';
    };

    it("should generate Spanish expense query response", () => {
      const response = generateQueryResponse('monthlyExpenses', {
        monthlyExpenses: 1500,
        monthlyIncome: 5000,
        clientCount: 3,
      }, 'es');
      
      expect(response).toContain('1,500');
      expect(response).toContain('gastado');
    });

    it("should generate English income query response", () => {
      const response = generateQueryResponse('monthlyIncome', {
        monthlyExpenses: 1500,
        monthlyIncome: 5000,
        clientCount: 3,
      }, 'en');
      
      expect(response).toContain('5,000');
      expect(response).toContain('received');
    });

    it("should calculate balance correctly", () => {
      const response = generateQueryResponse('balance', {
        monthlyExpenses: 1500,
        monthlyIncome: 5000,
        clientCount: 3,
      }, 'es');
      
      expect(response).toContain('3,500');
    });

    it("should handle singular/plural clients", () => {
      const singleClient = generateQueryResponse('clientCount', {
        monthlyExpenses: 0,
        monthlyIncome: 0,
        clientCount: 1,
      }, 'es');
      
      const multipleClients = generateQueryResponse('clientCount', {
        monthlyExpenses: 0,
        monthlyIncome: 0,
        clientCount: 5,
      }, 'es');
      
      expect(singleClient).toContain('1 cliente');
      expect(multipleClients).toContain('5 clientes');
    });
  });
});

describe("Voice Command Confirmation", () => {
  describe("Confirmation Flow", () => {
    it("should require confirmation for create actions", () => {
      const requiresConfirmation = (actionType: string): boolean => {
        return ['create', 'delete', 'update'].includes(actionType);
      };

      expect(requiresConfirmation('create')).toBe(true);
      expect(requiresConfirmation('delete')).toBe(true);
      expect(requiresConfirmation('navigate')).toBe(false);
      expect(requiresConfirmation('query')).toBe(false);
    });

    it("should format confirmation message", () => {
      const formatConfirmation = (action: string, details: string, language: string): string => {
        const templates = {
          es: `¿Confirmas ${action}: ${details}?`,
          en: `Confirm ${action}: ${details}?`,
        };
        return templates[language as keyof typeof templates] || templates.es;
      };

      const esConfirm = formatConfirmation('crear gasto', '$50 en comida', 'es');
      expect(esConfirm).toContain('Confirmas');
      expect(esConfirm).toContain('$50');

      const enConfirm = formatConfirmation('create expense', '$50 for food', 'en');
      expect(enConfirm).toContain('Confirm');
    });
  });

  describe("Confirmation Response Parsing", () => {
    const isConfirmation = (text: string): boolean => {
      const lower = text.toLowerCase().trim();
      const confirmWords = ['sí', 'si', 'yes', 'confirmar', 'confirm', 'ok', 'dale', 'hazlo'];
      return confirmWords.some(word => lower.includes(word));
    };

    const isCancellation = (text: string): boolean => {
      const lower = text.toLowerCase().trim();
      const cancelWords = ['no', 'cancelar', 'cancel', 'detener', 'stop', 'parar'];
      return cancelWords.some(word => lower.includes(word));
    };

    it("should detect confirmation in Spanish", () => {
      expect(isConfirmation('sí')).toBe(true);
      expect(isConfirmation('confirmar')).toBe(true);
      expect(isConfirmation('dale')).toBe(true);
    });

    it("should detect confirmation in English", () => {
      expect(isConfirmation('yes')).toBe(true);
      expect(isConfirmation('confirm')).toBe(true);
      expect(isConfirmation('ok')).toBe(true);
    });

    it("should detect cancellation", () => {
      expect(isCancellation('no')).toBe(true);
      expect(isCancellation('cancelar')).toBe(true);
      expect(isCancellation('cancel')).toBe(true);
    });
  });
});

describe("Voice Command Error Recovery", () => {
  it("should provide helpful error messages", () => {
    const getErrorMessage = (errorType: string, language: string): string => {
      const messages = {
        es: {
          noAmount: 'No pude detectar el monto. ¿Cuánto fue el gasto?',
          noCategory: 'No detecté la categoría. ¿En qué categoría lo clasificamos?',
          noClient: 'No encontré ese cliente. ¿Puedes repetir el nombre?',
          networkError: 'Error de conexión. Por favor intenta de nuevo.',
        },
        en: {
          noAmount: "I couldn't detect the amount. How much was the expense?",
          noCategory: "I didn't detect the category. What category should I use?",
          noClient: "I couldn't find that client. Can you repeat the name?",
          networkError: 'Connection error. Please try again.',
        },
      };
      
      const lang = messages[language as keyof typeof messages] || messages.es;
      return lang[errorType as keyof typeof lang] || '';
    };

    expect(getErrorMessage('noAmount', 'es')).toContain('monto');
    expect(getErrorMessage('noAmount', 'en')).toContain('amount');
    expect(getErrorMessage('networkError', 'es')).toContain('conexión');
  });

  it("should suggest corrections", () => {
    const suggestCorrection = (input: string, expected: string[]): string | null => {
      const lower = input.toLowerCase();
      
      // Simple Levenshtein-like matching
      for (const word of expected) {
        if (word.includes(lower) || lower.includes(word)) {
          return word;
        }
      }
      
      return null;
    };

    expect(suggestCorrection('gasto', ['gastos', 'ingreso'])).toBe('gastos');
    expect(suggestCorrection('cliente', ['clientes', 'proyectos'])).toBe('clientes');
  });
});
