/*
  Motor de traducción de toda la web, sin build ni framework.

  Cómo funciona: el español es el idioma "fuente" ya escrito a mano en
  cada página. Para traducir NO se tocan las plantillas HTML — en vez de
  eso, aplyTranslations() recorre los nodos de texto reales del DOM con
  un TreeWalker y, para cada uno, busca su texto (recortado de espacios)
  como clave en el diccionario del idioma elegido; si hay traducción, la
  aplica, si no, lo deja en español. Lo mismo para los atributos
  placeholder/title/aria-label. El texto original de cada nodo se guarda
  una única vez en un WeakMap (TEXT_ORIGINAL) la primera vez que se toca,
  así que cambiar de idioma varias veces (incluido volver a español)
  siempre parte del original real, nunca de una traducción ya aplicada
  encima de otra.

  Contenido añadido más tarde por otras páginas (listas renderizadas por
  fetch, modales, etc.) se traduce solo si coincide con una clave ya
  existente en el diccionario — se cubre automáticamente gracias al
  MutationObserver de abajo, sin que cada página tenga que llamar nada
  después de pintar su contenido dinámico.

  Para los pocos textos realmente paramétricos (con un número o símbolo
  dentro, tipo "+42 cuentas ya creadas") no sirve el calco de texto
  exacto — esos usan window.i18n.t('clave', { var: valor }) directamente
  desde el JS de la página en vez de contar con el recorrido automático.
*/
(function () {
  const STORAGE_KEY = 'cryptolyzer_lang';
  const SUPPORTED = ['es', 'en', 'pt', 'fr', 'de'];
  const LANG_LABELS = {
    es: { short: 'ES', name: 'Español' },
    en: { short: 'EN', name: 'English' },
    pt: { short: 'PT', name: 'Português' },
    fr: { short: 'FR', name: 'Français' },
    de: { short: 'DE', name: 'Deutsch' },
  };

  // ---------------------------------------------------------------------
  // Diccionarios: clave = texto EXACTO en español tal y como aparece en
  // el DOM (recortado de espacios al principio/final). Un mismo texto
  // español que aparece varias veces en la web se traduce una sola vez
  // aquí y sirve para todas sus apariciones.
  // ---------------------------------------------------------------------
  const DICTS = {
    en: {
      // Nav / cabecera
      'El AI Market Analyzer ya está disponible': 'The AI Market Analyzer is now available',
      'Cerrar aviso': 'Close notice',
      'Funciones': 'Features',
      'Cómo funciona': 'How it works',
      'FAQ': 'FAQ',
      'Analizar un gráfico →': 'Analyze a chart →',
      'Iniciar sesión': 'Log in',
      'Saltar intro': 'Skip intro',

      // Hero
      'Sesgo, escenarios y niveles — nunca una certeza inventada': 'Bias, scenarios and levels — never a made-up certainty',
      'Lee el mercado.': 'Read the market.',
      'Antes de que se mueva.': 'Before it moves.',
      'El analizador de IA para leer el mercado antes de operar.': 'The AI analyzer that reads the market before you trade.',
      'Sube cualquier gráfico y deja que la IA detecte patrones, niveles y contexto en segundos — sin ruido, sin adivinar.': 'Upload any chart and let the AI detect patterns, levels and context in seconds — no noise, no guessing.',
      'Analizar mi gráfico →': 'Analyze my chart →',
      'Análisis con IA real': 'Real AI analysis',
      'Gratis para empezar': 'Free to start',
      'Sin arriesgar dinero real': 'No real money at risk',
      'IA analizando': 'AI analyzing',
      'Análisis IA': 'AI analysis',
      'Tendencia alcista': 'Uptrend',
      'Confianza': 'Confidence',
      'Resistencia': 'Resistance',
      'Precio actual': 'Current price',
      'Soporte': 'Support',
      'Vista previa ilustrativa — así se ve un análisis real dentro de la app. No es una recomendación de inversión.': 'Illustrative preview — this is what a real analysis looks like inside the app. Not investment advice.',

      // Showcase
      'Empieza a analizar gratis': 'Start analyzing for free',
      'Tu gráfico.': 'Your chart.',
      'Explicado por IA.': 'Explained by AI.',
      'Sube cualquier gráfico y deja que la IA lo convierta en soportes, resistencias y contexto claro — en segundos.': 'Upload any chart and let AI turn it into support, resistance and clear context — in seconds.',
      'Sin tarjeta': 'No card needed',
      'Análisis con IA': 'AI analysis',
      'Empieza gratis': 'Start for free',
      'Actualizado hace 2s': 'Updated 2s ago',
      'Ruptura alcista': 'Bullish breakout',
      'Vista previa con datos de ejemplo — no es una recomendación de inversión.': 'Preview with sample data — not investment advice.',

      // App showcase
      'La app': 'The app',
      'Todo lo que necesitas,': 'Everything you need,',
      'en un solo lugar.': 'in one place.',
      'Accede a todas las herramientas de Cryptolyzer en una experiencia rápida, intuitiva y diseñada para traders de todos los niveles.': 'Access every Cryptolyzer tool in a fast, intuitive experience designed for traders of every level.',
      'Rápida': 'Fast',
      'Analiza y actúa en segundos.': 'Analyze and act in seconds.',
      'Segura': 'Secure',
      'Tus datos siempre protegidos.': 'Your data, always protected.',
      'En cualquier dispositivo': 'On any device',
      'Desde el navegador, sin instalar nada.': 'From the browser, nothing to install.',
      'Gráficos avanzados': 'Advanced charts',
      'Herramientas profesionales para un análisis más preciso.': 'Professional tools for a more precise analysis.',
      'IA integrada': 'Built-in AI',
      'Obtén análisis claros y accionables en segundos.': 'Get clear, actionable analysis in seconds.',
      'Múltiples mercados': 'Multiple markets',
      'Cripto, acciones, forex y más.': 'Crypto, stocks, forex and more.',
      'Alertas y notificaciones': 'Alerts and notifications',
      'No te pierdas ninguna oportunidad.': "Don't miss a single opportunity.",
      'Disponible en cualquier dispositivo': 'Available on any device',
      'Sin descargas — accede desde el navegador.': 'No downloads — access from the browser.',
      'Escritorio': 'Desktop',
      'Móvil': 'Mobile',
      'Nueva señal disponible': 'New signal available',
      'Buscar un activo, símbolo o mercado…': 'Search an asset, symbol or market…',
      'Análisis de IA': 'AI analysis',
      'Hace 2 min': '2 min ago',
      'Momentum positivo': 'Positive momentum',
      'Riesgo medio': 'Medium risk',
      'Ver análisis completo →': 'View full analysis →',
      'Explora todos los mercados': 'Explore every market',
      'Más activos, más oportunidades.': 'More assets, more opportunities.',
      'Vista ilustrativa de la interfaz de Cryptolyzer, con datos de ejemplo — no es una recomendación de inversión.': "Illustrative view of Cryptolyzer's interface, with sample data — not investment advice.",

      // Flow section
      'Cómo funciona Cryptolyzer': 'How Cryptolyzer works',
      'Del gráfico a una decisión clara.': 'From a chart to a clear decision.',
      'Cryptolyzer analiza tu gráfico, identifica las señales relevantes y transforma los datos en una lectura sencilla del mercado.': 'Cryptolyzer analyzes your chart, spots the relevant signals and turns the data into a simple read of the market.',
      'Gráfico': 'Chart',
      'Analizando señales': 'Analyzing signals',
      'Resultado': 'Result',
      'COMPRAR': 'BUY',
      'Riesgo': 'Risk',
      'Medio': 'Medium',
      'Vista ilustrativa de cómo se ve un análisis dentro de la app — no es una recomendación de inversión.': 'Illustrative view of how an analysis looks inside the app — not investment advice.',
      'Probar el AI Analyzer gratis →': 'Try the AI Analyzer for free →',

      // Memecoins
      'Nuevo · Memecoins': 'New · Memecoins',
      'Ahora también con ': 'Now also with ',
      'Amplía tus análisis con Cryptolyzer AI y explora nuevas oportunidades del mercado — mismo motor, mismo rigor técnico, sin tener que esperar a que una moneda nueva "se añada" a mano.': 'Expand your analysis with Cryptolyzer AI and explore new market opportunities — same engine, same technical rigor, with no need to wait for a new coin to be "added" by hand.',
      'Búsqueda real': 'Real search',
      'Encuentra DOGE, SHIB, PEPE y cientos más por nombre o símbolo.': 'Find DOGE, SHIB, PEPE and hundreds more by name or symbol.',
      'Sin datos inventados': 'No made-up data',
      'Si un dato de mercado no está disponible, Cryptolyzer te lo dice — nunca lo simula.': "If a market data point isn't available, Cryptolyzer tells you — it never fakes it.",
      'Analizar una memecoin →': 'Analyze a memecoin →',
      'Momentum alcista': 'Bullish momentum',
      'Datos de ejemplo con fines ilustrativos — Cryptolyzer nunca inventa precios ni métricas de mercado reales.': 'Sample data for illustration purposes — Cryptolyzer never makes up real market prices or metrics.',

      // Herramientas
      'Todo lo que necesitas para operar sin miedo a equivocarte.': 'Everything you need to trade without fear of getting it wrong.',
      'Un analizador de gráficos, picks diarios y un simulador completo de trading — todo dentro de la misma cuenta.': 'A chart analyzer, daily picks and a full trading simulator — all within the same account.',
      'El analizador de gráficos que nunca duerme.': 'The chart analyzer that never sleeps.',
      'Sube cualquier captura y obtén soportes, resistencias y una lectura de confianza al instante, para cualquier mercado.': 'Upload any screenshot and get support, resistance and a confidence reading instantly, for any market.',
      'Funciona con cualquier mercado': 'Works with any market',
      'Cripto, forex o acciones — sube la imagen del gráfico y listo, sin conectar ninguna cuenta.': "Crypto, forex or stocks — upload the chart image and that's it, no account to connect.",
      'Probarlo →': 'Try it →',
      'Resultados con confianza real': 'Results with real confidence',
      'Cada análisis indica su propio nivel de certeza, para que decidas con criterio y no a ciegas.': 'Every analysis shows its own confidence level, so you decide with judgment, not blindly.',
      'Ver un ejemplo →': 'See an example →',
      'Probar el Analyzer →': 'Try the Analyzer →',
      'Market Scanner: el mercado, escaneado en vivo.': 'Market Scanner: the market, scanned live.',
      'El mismo motor de señal del Analyzer, pasado por los principales activos con datos reales — sin que la IA tenga que inventar nada si el mercado no da señales claras.': "The same signal engine as the Analyzer, run across the main assets with real data — without the AI having to invent anything when the market gives no clear signal.",
      'Recalculado al momento': 'Recalculated on the spot',
      'Cada vez que abres el Scanner se vuelve a calcular con los datos más recientes — no es una lista guardada de ayer.': "Every time you open the Scanner it recalculates with the latest data — it's never a list saved from yesterday.",
      'Ver el Scanner →': 'View the Scanner →',
      'Sin resultados de relleno': 'No filler results',
      'Si no hay datos de mercado fiables en ese momento, el Scanner lo dice claramente en vez de mostrar una lectura inventada.': "If there's no reliable market data at that moment, the Scanner says so clearly instead of showing a made-up reading.",
      'Vista previa del Scanner': 'Scanner preview',
      'Alcista': 'Bullish',
      'Lateral': 'Sideways',
      'Bajista': 'Bearish',
      'Sigue a traders y wallets': 'Follow traders and wallets',
      'Modo simulado': 'Simulated mode',
      'Practica replicando estrategias ajenas dentro de tu propia cuenta de paper trading, sin arriesgar un euro real.': "Practice copying other people's strategies within your own paper trading account, without risking a single real euro.",
      'Wallet Tracker': 'Wallet Tracker',
      'Sigue la actividad de cualquier dirección y observa sus movimientos recientes.': "Track any address's activity and watch its recent moves.",
      'Probar Wallet Tracker →': 'Try Wallet Tracker →',
      'Copy Trading simulado': 'Simulated Copy Trading',
      'Copia automáticamente las operaciones de traders modelo dentro de tu saldo virtual.': "Automatically copy model traders' trades within your virtual balance.",
      'Ver traders →': 'View traders →',
      'Vista previa · Wallet Tracker (dirección de ejemplo)': 'Preview · Wallet Tracker (sample address)',
      'Vista previa · Trader modelo real de Copy Trading': 'Preview · Real model trader from Copy Trading',
      'Sigue tendencias en BTC/ETH con gestión de riesgo ajustada.': 'Follows trends on BTC/ETH with tight risk management.',
      'acierto': 'win rate',
      'Ver cómo funciona →': 'See how it works →',

      // Pricing
      'Tres planes, sin sorpresas.': 'Three plans, no surprises.',
      'Empieza gratis. Mejora cuando quieras más análisis y más herramientas.': 'Start for free. Upgrade whenever you want more analysis and more tools.',
      'Gratis': 'Free',
      '/ siempre': '/ forever',
      '3 análisis con IA al día': '3 AI analyses per day',
      'Paper Trading ilimitado': 'Unlimited Paper Trading',
      'Market Scanner en vivo': 'Live Market Scanner',
      'Crear cuenta gratis': 'Create free account',
      'Cryptolyzer Pro': 'Cryptolyzer Pro',
      '/ mes': '/ month',
      '15 análisis con IA al día': '15 AI analyses per day',
      'Todo lo del plan gratis': 'Everything in the free plan',
      'Elegir Pro': 'Choose Pro',
      'Más popular': 'Most popular',
      'Cryptolyzer Business': 'Cryptolyzer Business',
      'Análisis con IA ilimitados': 'Unlimited AI analyses',
      'Cancela cuando quieras': 'Cancel anytime',
      'Hazte Business': 'Go Business',
      'Cryptolyzer · Planes': 'Cryptolyzer · Plans',
      'Elige cómo quieres ': 'Choose how you want to ',
      'analizar': 'analyze',
      'Empieza con lo esencial. Desbloquea todo el potencial de Cryptolyzer cuando estés preparado.': "Start with the essentials. Unlock the full power of Cryptolyzer whenever you're ready.",
      'Pro': 'Pro',
      'Todo lo que necesitas para empezar a analizar el mercado con IA.': 'Everything you need to start analyzing the market with AI.',
      '/mes': '/month',
      'Análisis con IA al día': 'AI analyses per day',
      'Market Scanner': 'Market Scanner',
      'En vivo': 'Live',
      'Empezar con Pro →': 'Start with Pro →',
      'Business': 'Business',
      'Más potente': 'Most powerful',
      'Todas las herramientas. Sin límites. Lleva tu análisis al siguiente nivel.': 'Every tool. No limits. Take your analysis to the next level.',
      'Elegir Business →': 'Choose Business →',

      // FAQ
      'Preguntas frecuentes': 'Frequently asked questions',
      'Todo lo que ': 'Everything you ',
      'necesitas saber': 'need to know',
      'Resolvemos las dudas más comunes para que empieces a analizar el mercado con total confianza.': 'We answer the most common questions so you can start analyzing the market with full confidence.',
      '¿Tienes otra pregunta?': 'Have another question?',
      'Si no encuentras la respuesta que buscas, estamos aquí para ayudarte.': "If you can't find the answer you're looking for, we're here to help.",
      'Contactar soporte →': 'Contact support →',
      '¿Es dinero real?': 'Is it real money?',
      'No. Paper Trading, Wallet Tracker y Copy Trading funcionan con saldo virtual y datos simulados — puedes practicar sin arriesgar un euro real.': 'No. Paper Trading, Wallet Tracker and Copy Trading all run on a virtual balance and simulated data — you can practice without risking a single real euro.',
      '¿El análisis de IA es real?': 'Is the AI analysis real?',
      'Sí. El AI Market Analyzer usa un modelo de IA real para leer el gráfico que subas y generar el análisis — no son resultados de plantilla.': 'Yes. The AI Market Analyzer uses a real AI model to read the chart you upload and generate the analysis — these are not template results.',
      '¿Necesito experiencia previa?': 'Do I need prior experience?',
      'No. Cryptolyzer está pensado para aprender practicando, con una lectura clara en cada análisis y sin arriesgar dinero mientras coges soltura.': "No. Cryptolyzer is built for learning by doing, with a clear read on every analysis and no money at risk while you build confidence.",
      '¿Qué pasa con mis datos?': 'What happens to my data?',
      'Tu email y contraseña se guardan de forma segura y nunca se comparten. Cryptolyzer nunca pide acceso a tus cuentas de exchange ni a tu dinero real.': 'Your email and password are stored securely and never shared. Cryptolyzer never asks for access to your exchange accounts or your real money.',
      '¿Puedo cancelar cuando quiera?': 'Can I cancel anytime?',
      'Sí. Puedes cancelar tu suscripción Pro en cualquier momento desde Ajustes, sin permanencia ni penalización.': 'Yes. You can cancel your Pro subscription at any time from Settings, with no commitment and no penalty.',
      '¿Qué necesito para empezar?': 'What do I need to get started?',
      'Solo un email. Crea tu cuenta gratis y ya puedes subir tu primer gráfico en menos de un minuto.': 'Just an email. Create your free account and you can upload your first chart in under a minute.',

      // Final CTA
      '¿Listo para dejar de improvisar?': 'Ready to stop improvising?',
      'Crea tu cuenta gratis y analiza tu primer gráfico en menos de un minuto.': 'Create your free account and analyze your first chart in under a minute.',
      'Crear cuenta gratis →': 'Create free account →',

      // Footer
      'Analiza el mercado con IA, practica sin riesgo y sigue a los mejores — todo en un solo sitio.': 'Analyze the market with AI, practice risk-free and follow the best — all in one place.',
      'Producto': 'Product',
      'Herramientas': 'Tools',
      'Precio': 'Pricing',
      'Cuenta': 'Account',
      'Legal': 'Legal',
      'Términos de uso': 'Terms of use',
      'Privacidad': 'Privacy',
      'Cookies': 'Cookies',
      '© 2026 Cryptolyzer. Paper Trading, Wallet Tracker y Copy Trading funcionan en modo simulado — sin dinero real.': '© 2026 Cryptolyzer. Paper Trading, Wallet Tracker and Copy Trading all run in simulated mode — no real money involved.',

      // Auth modal
      'Acceso a Cryptolyzer': 'Access to Cryptolyzer',
      'Cerrar': 'Close',
      'Analiza. Practica. Sigue.': 'Analyze. Practice. Follow.',
      'Bienvenido de nuevo': 'Welcome back',
      'Introduce tus datos para continuar.': 'Enter your details to continue.',
      'Crea tu cuenta': 'Create your account',
      'Empieza en menos de un minuto.': 'Get started in under a minute.',
      'Crear cuenta': 'Create account',
      'Email': 'Email',
      'Contraseña': 'Password',
      'Mostrar contraseña': 'Show password',
      'Ocultar contraseña': 'Hide password',
      'Entrar': 'Log in',
      'Entrando…': 'Logging in…',
      'Nombre': 'Name',
      'Tu nombre': 'Your name',
      'Creando cuenta…': 'Creating account…',
      'Al continuar, aceptas nuestros ': 'By continuing, you agree to our ',
      'Términos': 'Terms',
      ' y ': ' and ',
      'Política de privacidad': 'Privacy Policy',

      // Plan modal
      'Detalles del plan': 'Plan details',
      'Crear cuenta y continuar →': 'Create account and continue →',
      'Pago seguro con Stripe. Cancela cuando quieras desde tu cuenta.': 'Secure payment with Stripe. Cancel anytime from your account.',

      // Textos dinámicos estáticos (fijados por JS, sin interpolación)
      'Nueva cuenta creada en Cryptolyzer': 'New account created on Cryptolyzer',
      'Alguien acaba de analizar un gráfico con IA': 'Someone just analyzed a chart with AI',
      'Se abrió una posición en Paper Trading': 'A position was opened in Paper Trading',
      'Se cerró una posición en Paper Trading': 'A position was closed in Paper Trading',
      'justo ahora': 'just now',
      '😢 Por favor, vuelve': '😢 Please come back',

      // Fase 2 — navegación compartida (sidebar/topbar/modales)
      'Inicio': 'Home',
      'Historial': 'History',
      'Estado de conexión': 'Connection status',
      'En línea': 'Online',
      'Sin conexión': 'Offline',
      'Ajustes': 'Settings',
      'Cerrar sesión': 'Log out',
      'Navegación': 'Navigation',
      'Perfil': 'Profile',
      'Todavía no has añadido una biografía.': "You haven't added a bio yet.",
      'Plan gratuito': 'Free plan',
      'Editar perfil': 'Edit profile',
      'Cambiar foto de perfil': 'Change profile photo',
      'Mejora tu plan': 'Upgrade your plan',
      'Elegir Business': 'Choose Business',
      'Suscripción con renovación automática mensual hasta que la canceles. Se te cobrará el importe mostrado hoy y el mismo importe en cada renovación. Puedes cancelar la renovación en cualquier momento desde "Suscripción y facturación" — seguirás teniendo acceso hasta el final del periodo ya pagado. Ver': 'Monthly subscription that renews automatically until you cancel it. You will be charged the amount shown today and the same amount on each renewal. You can cancel the renewal at any time from "Subscription & billing" — you will keep access until the end of the period already paid for. See',
      'cancelación y reembolsos': 'cancellation and refunds',
      'Un momento…': 'One moment…',
      'Cambiar foto': 'Change photo',
      'Quitar foto': 'Remove photo',
      'Biografía': 'Bio',
      'Cuenta algo sobre ti (opcional)': 'Tell us something about you (optional)',
      'Plan actual:': 'Current plan:',
      'Gratuito': 'Free',
      'Mejorar plan': 'Upgrade plan',
      'Suscripción y facturación': 'Subscription & billing',
      'Guardar': 'Save',
      'Cancelar': 'Cancel',
      'El nombre no puede estar vacío.': 'The name cannot be empty.',
      'Guardando…': 'Saving…',
      'Ajustes guardados.': 'Settings saved.',
      'No se pudo actualizar la foto.': "Couldn't update the photo.",
      'Foto de perfil actualizada.': 'Profile photo updated.',
      'Entendido': 'Got it',
    },

    pt: {
      'El AI Market Analyzer ya está disponible': 'O AI Market Analyzer já está disponível',
      'Cerrar aviso': 'Fechar aviso',
      'Funciones': 'Funcionalidades',
      'Cómo funciona': 'Como funciona',
      'FAQ': 'FAQ',
      'Analizar un gráfico →': 'Analisar um gráfico →',
      'Iniciar sesión': 'Entrar',
      'Saltar intro': 'Pular introdução',

      'Sesgo, escenarios y niveles — nunca una certeza inventada': 'Viés, cenários e níveis — nunca uma certeza inventada',
      'Lee el mercado.': 'Leia o mercado.',
      'Antes de que se mueva.': 'Antes que ele se mova.',
      'El analizador de IA para leer el mercado antes de operar.': 'O analisador de IA para ler o mercado antes de operar.',
      'Sube cualquier gráfico y deja que la IA detecte patrones, niveles y contexto en segundos — sin ruido, sin adivinar.': 'Envie qualquer gráfico e deixe a IA detectar padrões, níveis e contexto em segundos — sem ruído, sem adivinhação.',
      'Analizar mi gráfico →': 'Analisar meu gráfico →',
      'Análisis con IA real': 'Análise com IA real',
      'Gratis para empezar': 'Grátis para começar',
      'Sin arriesgar dinero real': 'Sem arriscar dinheiro real',
      'IA analizando': 'IA analisando',
      'Análisis IA': 'Análise de IA',
      'Tendencia alcista': 'Tendência de alta',
      'Confianza': 'Confiança',
      'Resistencia': 'Resistência',
      'Precio actual': 'Preço atual',
      'Soporte': 'Suporte',
      'Vista previa ilustrativa — así se ve un análisis real dentro de la app. No es una recomendación de inversión.': 'Visualização ilustrativa — assim é uma análise real dentro do app. Não é uma recomendação de investimento.',

      'Empieza a analizar gratis': 'Comece a analisar de graça',
      'Tu gráfico.': 'Seu gráfico.',
      'Explicado por IA.': 'Explicado por IA.',
      'Sube cualquier gráfico y deja que la IA lo convierta en soportes, resistencias y contexto claro — en segundos.': 'Envie qualquer gráfico e deixe a IA transformá-lo em suportes, resistências e contexto claro — em segundos.',
      'Sin tarjeta': 'Sem cartão',
      'Análisis con IA': 'Análise com IA',
      'Empieza gratis': 'Comece de graça',
      'Actualizado hace 2s': 'Atualizado há 2s',
      'Ruptura alcista': 'Rompimento de alta',
      'Vista previa con datos de ejemplo — no es una recomendación de inversión.': 'Visualização com dados de exemplo — não é uma recomendação de investimento.',

      'La app': 'O app',
      'Todo lo que necesitas,': 'Tudo o que você precisa,',
      'en un solo lugar.': 'em um só lugar.',
      'Accede a todas las herramientas de Cryptolyzer en una experiencia rápida, intuitiva y diseñada para traders de todos los niveles.': 'Acesse todas as ferramentas da Cryptolyzer em uma experiência rápida, intuitiva e feita para traders de todos os níveis.',
      'Rápida': 'Rápido',
      'Analiza y actúa en segundos.': 'Analise e aja em segundos.',
      'Segura': 'Seguro',
      'Tus datos siempre protegidos.': 'Seus dados sempre protegidos.',
      'En cualquier dispositivo': 'Em qualquer dispositivo',
      'Desde el navegador, sin instalar nada.': 'Direto do navegador, sem instalar nada.',
      'Gráficos avanzados': 'Gráficos avançados',
      'Herramientas profesionales para un análisis más preciso.': 'Ferramentas profissionais para uma análise mais precisa.',
      'IA integrada': 'IA integrada',
      'Obtén análisis claros y accionables en segundos.': 'Obtenha análises claras e acionáveis em segundos.',
      'Múltiples mercados': 'Vários mercados',
      'Cripto, acciones, forex y más.': 'Cripto, ações, forex e mais.',
      'Alertas y notificaciones': 'Alertas e notificações',
      'No te pierdas ninguna oportunidad.': 'Não perca nenhuma oportunidade.',
      'Disponible en cualquier dispositivo': 'Disponível em qualquer dispositivo',
      'Sin descargas — accede desde el navegador.': 'Sem downloads — acesse pelo navegador.',
      'Escritorio': 'Computador',
      'Móvil': 'Celular',
      'Nueva señal disponible': 'Novo sinal disponível',
      'Buscar un activo, símbolo o mercado…': 'Buscar um ativo, símbolo ou mercado…',
      'Análisis de IA': 'Análise de IA',
      'Hace 2 min': 'Há 2 min',
      'Momentum positivo': 'Momentum positivo',
      'Riesgo medio': 'Risco médio',
      'Ver análisis completo →': 'Ver análise completa →',
      'Explora todos los mercados': 'Explore todos os mercados',
      'Más activos, más oportunidades.': 'Mais ativos, mais oportunidades.',
      'Vista ilustrativa de la interfaz de Cryptolyzer, con datos de ejemplo — no es una recomendación de inversión.': 'Visualização ilustrativa da interface da Cryptolyzer, com dados de exemplo — não é uma recomendação de investimento.',

      'Cómo funciona Cryptolyzer': 'Como funciona a Cryptolyzer',
      'Del gráfico a una decisión clara.': 'Do gráfico a uma decisão clara.',
      'Cryptolyzer analiza tu gráfico, identifica las señales relevantes y transforma los datos en una lectura sencilla del mercado.': 'A Cryptolyzer analisa seu gráfico, identifica os sinais relevantes e transforma os dados em uma leitura simples do mercado.',
      'Gráfico': 'Gráfico',
      'Analizando señales': 'Analisando sinais',
      'Resultado': 'Resultado',
      'COMPRAR': 'COMPRAR',
      'Riesgo': 'Risco',
      'Medio': 'Médio',
      'Vista ilustrativa de cómo se ve un análisis dentro de la app — no es una recomendación de inversión.': 'Visualização ilustrativa de como é uma análise dentro do app — não é uma recomendação de investimento.',
      'Probar el AI Analyzer gratis →': 'Experimentar o AI Analyzer de graça →',

      'Nuevo · Memecoins': 'Novo · Memecoins',
      'Ahora también con ': 'Agora também com ',
      'Amplía tus análisis con Cryptolyzer AI y explora nuevas oportunidades del mercado — mismo motor, mismo rigor técnico, sin tener que esperar a que una moneda nueva "se añada" a mano.': 'Amplie suas análises com a Cryptolyzer AI e explore novas oportunidades do mercado — mesmo motor, mesmo rigor técnico, sem ter que esperar uma nova moeda ser "adicionada" manualmente.',
      'Búsqueda real': 'Busca real',
      'Encuentra DOGE, SHIB, PEPE y cientos más por nombre o símbolo.': 'Encontre DOGE, SHIB, PEPE e centenas mais por nome ou símbolo.',
      'Sin datos inventados': 'Sem dados inventados',
      'Si un dato de mercado no está disponible, Cryptolyzer te lo dice — nunca lo simula.': 'Se um dado de mercado não está disponível, a Cryptolyzer te avisa — nunca o simula.',
      'Analizar una memecoin →': 'Analisar uma memecoin →',
      'Momentum alcista': 'Momentum de alta',
      'Datos de ejemplo con fines ilustrativos — Cryptolyzer nunca inventa precios ni métricas de mercado reales.': 'Dados de exemplo para fins ilustrativos — a Cryptolyzer nunca inventa preços nem métricas de mercado reais.',

      'Todo lo que necesitas para operar sin miedo a equivocarte.': 'Tudo o que você precisa para operar sem medo de errar.',
      'Un analizador de gráficos, picks diarios y un simulador completo de trading — todo dentro de la misma cuenta.': 'Um analisador de gráficos, picks diários e um simulador completo de trading — tudo na mesma conta.',
      'El analizador de gráficos que nunca duerme.': 'O analisador de gráficos que nunca dorme.',
      'Sube cualquier captura y obtén soportes, resistencias y una lectura de confianza al instante, para cualquier mercado.': 'Envie qualquer captura de tela e obtenha suportes, resistências e uma leitura de confiança na hora, para qualquer mercado.',
      'Funciona con cualquier mercado': 'Funciona com qualquer mercado',
      'Cripto, forex o acciones — sube la imagen del gráfico y listo, sin conectar ninguna cuenta.': 'Cripto, forex ou ações — envie a imagem do gráfico e pronto, sem conectar nenhuma conta.',
      'Probarlo →': 'Experimentar →',
      'Resultados con confianza real': 'Resultados com confiança real',
      'Cada análisis indica su propio nivel de certeza, para que decidas con criterio y no a ciegas.': 'Cada análise indica seu próprio nível de certeza, para que você decida com critério e não às cegas.',
      'Ver un ejemplo →': 'Ver um exemplo →',
      'Probar el Analyzer →': 'Experimentar o Analyzer →',
      'Market Scanner: el mercado, escaneado en vivo.': 'Market Scanner: o mercado, escaneado ao vivo.',
      'El mismo motor de señal del Analyzer, pasado por los principales activos con datos reales — sin que la IA tenga que inventar nada si el mercado no da señales claras.': 'O mesmo motor de sinal do Analyzer, aplicado aos principais ativos com dados reais — sem que a IA precise inventar nada quando o mercado não dá sinais claros.',
      'Recalculado al momento': 'Recalculado na hora',
      'Cada vez que abres el Scanner se vuelve a calcular con los datos más recientes — no es una lista guardada de ayer.': 'Toda vez que você abre o Scanner ele recalcula com os dados mais recentes — não é uma lista salva de ontem.',
      'Ver el Scanner →': 'Ver o Scanner →',
      'Sin resultados de relleno': 'Sem resultados de preenchimento',
      'Si no hay datos de mercado fiables en ese momento, el Scanner lo dice claramente en vez de mostrar una lectura inventada.': 'Se não há dados de mercado confiáveis naquele momento, o Scanner diz isso claramente em vez de mostrar uma leitura inventada.',
      'Vista previa del Scanner': 'Pré-visualização do Scanner',
      'Alcista': 'Alta',
      'Lateral': 'Lateral',
      'Bajista': 'Baixa',
      'Sigue a traders y wallets': 'Siga traders e carteiras',
      'Modo simulado': 'Modo simulado',
      'Practica replicando estrategias ajenas dentro de tu propia cuenta de paper trading, sin arriesgar un euro real.': 'Pratique replicando estratégias de outros dentro da sua própria conta de paper trading, sem arriscar nenhum euro real.',
      'Wallet Tracker': 'Wallet Tracker',
      'Sigue la actividad de cualquier dirección y observa sus movimientos recientes.': 'Acompanhe a atividade de qualquer endereço e observe seus movimentos recentes.',
      'Probar Wallet Tracker →': 'Experimentar Wallet Tracker →',
      'Copy Trading simulado': 'Copy Trading simulado',
      'Copia automáticamente las operaciones de traders modelo dentro de tu saldo virtual.': 'Copie automaticamente as operações de traders modelo dentro do seu saldo virtual.',
      'Ver traders →': 'Ver traders →',
      'Vista previa · Wallet Tracker (dirección de ejemplo)': 'Pré-visualização · Wallet Tracker (endereço de exemplo)',
      'Vista previa · Trader modelo real de Copy Trading': 'Pré-visualização · Trader modelo real do Copy Trading',
      'Sigue tendencias en BTC/ETH con gestión de riesgo ajustada.': 'Segue tendências em BTC/ETH com gestão de risco ajustada.',
      'acierto': 'acerto',
      'Ver cómo funciona →': 'Ver como funciona →',

      'Tres planes, sin sorpresas.': 'Três planos, sem surpresas.',
      'Empieza gratis. Mejora cuando quieras más análisis y más herramientas.': 'Comece de graça. Faça upgrade quando quiser mais análises e mais ferramentas.',
      'Gratis': 'Grátis',
      '/ siempre': '/ para sempre',
      '3 análisis con IA al día': '3 análises com IA por dia',
      'Paper Trading ilimitado': 'Paper Trading ilimitado',
      'Market Scanner en vivo': 'Market Scanner ao vivo',
      'Crear cuenta gratis': 'Criar conta grátis',
      'Cryptolyzer Pro': 'Cryptolyzer Pro',
      '/ mes': '/ mês',
      '15 análisis con IA al día': '15 análises com IA por dia',
      'Todo lo del plan gratis': 'Tudo do plano grátis',
      'Elegir Pro': 'Escolher Pro',
      'Más popular': 'Mais popular',
      'Cryptolyzer Business': 'Cryptolyzer Business',
      'Análisis con IA ilimitados': 'Análises com IA ilimitadas',
      'Cancela cuando quieras': 'Cancele quando quiser',
      'Hazte Business': 'Torne-se Business',
      'Cryptolyzer · Planes': 'Cryptolyzer · Planos',
      'Elige cómo quieres ': 'Escolha como você quer ',
      'analizar': 'analisar',
      'Empieza con lo esencial. Desbloquea todo el potencial de Cryptolyzer cuando estés preparado.': 'Comece com o essencial. Desbloqueie todo o potencial da Cryptolyzer quando estiver pronto.',
      'Pro': 'Pro',
      'Todo lo que necesitas para empezar a analizar el mercado con IA.': 'Tudo o que você precisa para começar a analisar o mercado com IA.',
      '/mes': '/mês',
      'Análisis con IA al día': 'Análises com IA por dia',
      'Market Scanner': 'Market Scanner',
      'En vivo': 'Ao vivo',
      'Empezar con Pro →': 'Começar com Pro →',
      'Business': 'Business',
      'Más potente': 'Mais poderoso',
      'Todas las herramientas. Sin límites. Lleva tu análisis al siguiente nivel.': 'Todas as ferramentas. Sem limites. Leve sua análise para o próximo nível.',
      'Elegir Business →': 'Escolher Business →',

      'Preguntas frecuentes': 'Perguntas frequentes',
      'Todo lo que ': 'Tudo o que você ',
      'necesitas saber': 'precisa saber',
      'Resolvemos las dudas más comunes para que empieces a analizar el mercado con total confianza.': 'Respondemos as dúvidas mais comuns para você começar a analisar o mercado com total confiança.',
      '¿Tienes otra pregunta?': 'Tem outra pergunta?',
      'Si no encuentras la respuesta que buscas, estamos aquí para ayudarte.': 'Se você não encontrou a resposta que procurava, estamos aqui para ajudar.',
      'Contactar soporte →': 'Contatar suporte →',
      '¿Es dinero real?': 'É dinheiro real?',
      'No. Paper Trading, Wallet Tracker y Copy Trading funcionan con saldo virtual y datos simulados — puedes practicar sin arriesgar un euro real.': 'Não. Paper Trading, Wallet Tracker e Copy Trading funcionam com saldo virtual e dados simulados — você pode praticar sem arriscar nenhum euro real.',
      '¿El análisis de IA es real?': 'A análise de IA é real?',
      'Sí. El AI Market Analyzer usa un modelo de IA real para leer el gráfico que subas y generar el análisis — no son resultados de plantilla.': 'Sim. O AI Market Analyzer usa um modelo de IA real para ler o gráfico que você enviar e gerar a análise — não são resultados de modelo pronto.',
      '¿Necesito experiencia previa?': 'Preciso de experiência prévia?',
      'No. Cryptolyzer está pensado para aprender practicando, con una lectura clara en cada análisis y sin arriesgar dinero mientras coges soltura.': 'Não. A Cryptolyzer foi pensada para aprender praticando, com uma leitura clara em cada análise e sem arriscar dinheiro enquanto você ganha confiança.',
      '¿Qué pasa con mis datos?': 'O que acontece com meus dados?',
      'Tu email y contraseña se guardan de forma segura y nunca se comparten. Cryptolyzer nunca pide acceso a tus cuentas de exchange ni a tu dinero real.': 'Seu email e senha são guardados com segurança e nunca compartilhados. A Cryptolyzer nunca pede acesso às suas contas de exchange nem ao seu dinheiro real.',
      '¿Puedo cancelar cuando quiera?': 'Posso cancelar quando quiser?',
      'Sí. Puedes cancelar tu suscripción Pro en cualquier momento desde Ajustes, sin permanencia ni penalización.': 'Sim. Você pode cancelar sua assinatura Pro a qualquer momento em Configurações, sem fidelidade nem multa.',
      '¿Qué necesito para empezar?': 'O que eu preciso para começar?',
      'Solo un email. Crea tu cuenta gratis y ya puedes subir tu primer gráfico en menos de un minuto.': 'Só um email. Crie sua conta grátis e já pode enviar seu primeiro gráfico em menos de um minuto.',

      '¿Listo para dejar de improvisar?': 'Pronto para parar de improvisar?',
      'Crea tu cuenta gratis y analiza tu primer gráfico en menos de un minuto.': 'Crie sua conta grátis e analise seu primeiro gráfico em menos de um minuto.',
      'Crear cuenta gratis →': 'Criar conta grátis →',

      'Analiza el mercado con IA, practica sin riesgo y sigue a los mejores — todo en un solo sitio.': 'Analise o mercado com IA, pratique sem risco e siga os melhores — tudo em um só lugar.',
      'Producto': 'Produto',
      'Herramientas': 'Ferramentas',
      'Precio': 'Preço',
      'Cuenta': 'Conta',
      'Legal': 'Legal',
      'Términos de uso': 'Termos de uso',
      'Privacidad': 'Privacidade',
      'Cookies': 'Cookies',
      '© 2026 Cryptolyzer. Paper Trading, Wallet Tracker y Copy Trading funcionan en modo simulado — sin dinero real.': '© 2026 Cryptolyzer. Paper Trading, Wallet Tracker e Copy Trading funcionam em modo simulado — sem dinheiro real.',

      'Acceso a Cryptolyzer': 'Acesso à Cryptolyzer',
      'Cerrar': 'Fechar',
      'Analiza. Practica. Sigue.': 'Analise. Pratique. Siga.',
      'Bienvenido de nuevo': 'Bem-vindo de volta',
      'Introduce tus datos para continuar.': 'Digite seus dados para continuar.',
      'Crea tu cuenta': 'Crie sua conta',
      'Empieza en menos de un minuto.': 'Comece em menos de um minuto.',
      'Crear cuenta': 'Criar conta',
      'Email': 'Email',
      'Contraseña': 'Senha',
      'Mostrar contraseña': 'Mostrar senha',
      'Ocultar contraseña': 'Ocultar senha',
      'Entrar': 'Entrar',
      'Entrando…': 'Entrando…',
      'Nombre': 'Nome',
      'Tu nombre': 'Seu nome',
      'Creando cuenta…': 'Criando conta…',
      'Al continuar, aceptas nuestros ': 'Ao continuar, você aceita nossos ',
      'Términos': 'Termos',
      ' y ': ' e ',
      'Política de privacidad': 'Política de Privacidade',

      'Detalles del plan': 'Detalhes do plano',
      'Crear cuenta y continuar →': 'Criar conta e continuar →',
      'Pago seguro con Stripe. Cancela cuando quieras desde tu cuenta.': 'Pagamento seguro com Stripe. Cancele quando quiser pela sua conta.',

      'Nueva cuenta creada en Cryptolyzer': 'Nova conta criada na Cryptolyzer',
      'Alguien acaba de analizar un gráfico con IA': 'Alguém acabou de analisar um gráfico com IA',
      'Se abrió una posición en Paper Trading': 'Uma posição foi aberta no Paper Trading',
      'Se cerró una posición en Paper Trading': 'Uma posição foi fechada no Paper Trading',
      'justo ahora': 'agora mesmo',
      '😢 Por favor, vuelve': '😢 Por favor, volte',

      // Fase 2 — navegación compartida (sidebar/topbar/modales)
      'Inicio': 'Início',
      'Historial': 'Histórico',
      'Estado de conexión': 'Estado da conexão',
      'En línea': 'Online',
      'Sin conexión': 'Offline',
      'Ajustes': 'Configurações',
      'Cerrar sesión': 'Sair',
      'Navegación': 'Navegação',
      'Perfil': 'Perfil',
      'Todavía no has añadido una biografía.': 'Você ainda não adicionou uma biografia.',
      'Plan gratuito': 'Plano gratuito',
      'Editar perfil': 'Editar perfil',
      'Cambiar foto de perfil': 'Alterar foto de perfil',
      'Mejora tu plan': 'Melhore seu plano',
      'Elegir Business': 'Escolher Business',
      'Suscripción con renovación automática mensual hasta que la canceles. Se te cobrará el importe mostrado hoy y el mismo importe en cada renovación. Puedes cancelar la renovación en cualquier momento desde "Suscripción y facturación" — seguirás teniendo acceso hasta el final del periodo ya pagado. Ver': 'Assinatura com renovação automática mensal até que você a cancele. Você será cobrado o valor mostrado hoje e o mesmo valor em cada renovação. Você pode cancelar a renovação a qualquer momento em "Assinatura e faturamento" — você manterá o acesso até o final do período já pago. Veja',
      'cancelación y reembolsos': 'cancelamento e reembolsos',
      'Un momento…': 'Um momento…',
      'Cambiar foto': 'Alterar foto',
      'Quitar foto': 'Remover foto',
      'Biografía': 'Biografia',
      'Cuenta algo sobre ti (opcional)': 'Conte algo sobre você (opcional)',
      'Plan actual:': 'Plano atual:',
      'Gratuito': 'Gratuito',
      'Mejorar plan': 'Melhorar plano',
      'Suscripción y facturación': 'Assinatura e faturamento',
      'Guardar': 'Salvar',
      'Cancelar': 'Cancelar',
      'El nombre no puede estar vacío.': 'O nome não pode ficar vazio.',
      'Guardando…': 'Salvando…',
      'Ajustes guardados.': 'Configurações salvas.',
      'No se pudo actualizar la foto.': 'Não foi possível atualizar a foto.',
      'Foto de perfil actualizada.': 'Foto de perfil atualizada.',
      'Entendido': 'Entendi',
    },

    fr: {
      'El AI Market Analyzer ya está disponible': "L'AI Market Analyzer est maintenant disponible",
      'Cerrar aviso': "Fermer l'avis",
      'Funciones': 'Fonctionnalités',
      'Cómo funciona': 'Comment ça marche',
      'FAQ': 'FAQ',
      'Analizar un gráfico →': 'Analyser un graphique →',
      'Iniciar sesión': 'Se connecter',
      'Saltar intro': "Passer l'intro",

      'Sesgo, escenarios y niveles — nunca una certeza inventada': 'Biais, scénarios et niveaux — jamais une certitude inventée',
      'Lee el mercado.': 'Lisez le marché.',
      'Antes de que se mueva.': "Avant qu'il ne bouge.",
      'El analizador de IA para leer el mercado antes de operar.': "L'analyseur IA pour lire le marché avant de trader.",
      'Sube cualquier gráfico y deja que la IA detecte patrones, niveles y contexto en segundos — sin ruido, sin adivinar.': "Importez n'importe quel graphique et laissez l'IA détecter les motifs, les niveaux et le contexte en quelques secondes — sans bruit, sans deviner.",
      'Analizar mi gráfico →': 'Analyser mon graphique →',
      'Análisis con IA real': 'Analyse par une IA réelle',
      'Gratis para empezar': 'Gratuit pour commencer',
      'Sin arriesgar dinero real': 'Sans risquer de vrai argent',
      'IA analizando': "L'IA analyse",
      'Análisis IA': 'Analyse IA',
      'Tendencia alcista': 'Tendance haussière',
      'Confianza': 'Confiance',
      'Resistencia': 'Résistance',
      'Precio actual': 'Prix actuel',
      'Soporte': 'Support',
      'Vista previa ilustrativa — así se ve un análisis real dentro de la app. No es una recomendación de inversión.': "Aperçu illustratif — voici à quoi ressemble une vraie analyse dans l'app. Ce n'est pas un conseil en investissement.",

      'Empieza a analizar gratis': 'Commencez à analyser gratuitement',
      'Tu gráfico.': 'Votre graphique.',
      'Explicado por IA.': "Expliqué par l'IA.",
      'Sube cualquier gráfico y deja que la IA lo convierta en soportes, resistencias y contexto claro — en segundos.': "Importez n'importe quel graphique et laissez l'IA le transformer en supports, résistances et contexte clair — en quelques secondes.",
      'Sin tarjeta': 'Sans carte',
      'Análisis con IA': 'Analyse par IA',
      'Empieza gratis': 'Commencer gratuitement',
      'Actualizado hace 2s': 'Mis à jour il y a 2s',
      'Ruptura alcista': 'Cassure haussière',
      'Vista previa con datos de ejemplo — no es una recomendación de inversión.': "Aperçu avec des données d'exemple — ce n'est pas un conseil en investissement.",

      'La app': "L'app",
      'Todo lo que necesitas,': 'Tout ce dont vous avez besoin,',
      'en un solo lugar.': 'au même endroit.',
      'Accede a todas las herramientas de Cryptolyzer en una experiencia rápida, intuitiva y diseñada para traders de todos los niveles.': "Accédez à tous les outils de Cryptolyzer dans une expérience rapide, intuitive et pensée pour les traders de tous niveaux.",
      'Rápida': 'Rapide',
      'Analiza y actúa en segundos.': 'Analysez et agissez en quelques secondes.',
      'Segura': 'Sécurisée',
      'Tus datos siempre protegidos.': 'Vos données toujours protégées.',
      'En cualquier dispositivo': "Sur n'importe quel appareil",
      'Desde el navegador, sin instalar nada.': "Depuis le navigateur, sans rien installer.",
      'Gráficos avanzados': 'Graphiques avancés',
      'Herramientas profesionales para un análisis más preciso.': "Des outils professionnels pour une analyse plus précise.",
      'IA integrada': 'IA intégrée',
      'Obtén análisis claros y accionables en segundos.': "Obtenez des analyses claires et exploitables en quelques secondes.",
      'Múltiples mercados': 'Plusieurs marchés',
      'Cripto, acciones, forex y más.': 'Crypto, actions, forex et plus encore.',
      'Alertas y notificaciones': 'Alertes et notifications',
      'No te pierdas ninguna oportunidad.': "Ne manquez aucune opportunité.",
      'Disponible en cualquier dispositivo': "Disponible sur n'importe quel appareil",
      'Sin descargas — accede desde el navegador.': 'Sans téléchargement — accédez-y depuis le navigateur.',
      'Escritorio': 'Ordinateur',
      'Móvil': 'Mobile',
      'Nueva señal disponible': 'Nouveau signal disponible',
      'Buscar un activo, símbolo o mercado…': 'Rechercher un actif, un symbole ou un marché…',
      'Análisis de IA': 'Analyse IA',
      'Hace 2 min': 'Il y a 2 min',
      'Momentum positivo': 'Momentum positif',
      'Riesgo medio': 'Risque moyen',
      'Ver análisis completo →': "Voir l'analyse complète →",
      'Explora todos los mercados': 'Explorez tous les marchés',
      'Más activos, más oportunidades.': "Plus d'actifs, plus d'opportunités.",
      'Vista ilustrativa de la interfaz de Cryptolyzer, con datos de ejemplo — no es una recomendación de inversión.': "Aperçu illustratif de l'interface de Cryptolyzer, avec des données d'exemple — ce n'est pas un conseil en investissement.",

      'Cómo funciona Cryptolyzer': 'Comment fonctionne Cryptolyzer',
      'Del gráfico a una decisión clara.': 'Du graphique à une décision claire.',
      'Cryptolyzer analiza tu gráfico, identifica las señales relevantes y transforma los datos en una lectura sencilla del mercado.': 'Cryptolyzer analyse votre graphique, identifie les signaux pertinents et transforme les données en une lecture simple du marché.',
      'Gráfico': 'Graphique',
      'Analizando señales': 'Analyse des signaux',
      'Resultado': 'Résultat',
      'COMPRAR': 'ACHETER',
      'Riesgo': 'Risque',
      'Medio': 'Moyen',
      'Vista ilustrativa de cómo se ve un análisis dentro de la app — no es una recomendación de inversión.': "Aperçu illustratif de ce à quoi ressemble une analyse dans l'app — ce n'est pas un conseil en investissement.",
      'Probar el AI Analyzer gratis →': "Essayer l'AI Analyzer gratuitement →",

      'Nuevo · Memecoins': 'Nouveau · Memecoins',
      'Ahora también con ': 'Désormais aussi avec ',
      'Amplía tus análisis con Cryptolyzer AI y explora nuevas oportunidades del mercado — mismo motor, mismo rigor técnico, sin tener que esperar a que una moneda nueva "se añada" a mano.': "Élargissez vos analyses avec Cryptolyzer AI et explorez de nouvelles opportunités de marché — même moteur, même rigueur technique, sans attendre qu'une nouvelle pièce soit « ajoutée » manuellement.",
      'Búsqueda real': 'Recherche réelle',
      'Encuentra DOGE, SHIB, PEPE y cientos más por nombre o símbolo.': "Trouvez DOGE, SHIB, PEPE et des centaines d\'autres par nom ou symbole.",
      'Sin datos inventados': 'Aucune donnée inventée',
      'Si un dato de mercado no está disponible, Cryptolyzer te lo dice — nunca lo simula.': "Si une donnée de marché n'est pas disponible, Cryptolyzer vous le dit — elle ne la simule jamais.",
      'Analizar una memecoin →': 'Analyser une memecoin →',
      'Momentum alcista': 'Momentum haussier',
      'Datos de ejemplo con fines ilustrativos — Cryptolyzer nunca inventa precios ni métricas de mercado reales.': "Données d'exemple à titre illustratif — Cryptolyzer n'invente jamais de prix ni de métriques de marché réels.",

      'Todo lo que necesitas para operar sin miedo a equivocarte.': 'Tout ce dont vous avez besoin pour trader sans peur de vous tromper.',
      'Un analizador de gráficos, picks diarios y un simulador completo de trading — todo dentro de la misma cuenta.': "Un analyseur de graphiques, des picks quotidiens et un simulateur de trading complet — le tout dans le même compte.",
      'El analizador de gráficos que nunca duerme.': "L\'analyseur de graphiques qui ne dort jamais.",
      'Sube cualquier captura y obtén soportes, resistencias y una lectura de confianza al instante, para cualquier mercado.': "Importez n'importe quelle capture et obtenez supports, résistances et un niveau de confiance instantanément, pour n'importe quel marché.",
      'Funciona con cualquier mercado': "Fonctionne avec n'importe quel marché",
      'Cripto, forex o acciones — sube la imagen del gráfico y listo, sin conectar ninguna cuenta.': "Crypto, forex ou actions — importez l'image du graphique et c'est parti, sans connecter aucun compte.",
      'Probarlo →': "L'essayer →",
      'Resultados con confianza real': 'Des résultats avec une vraie confiance',
      'Cada análisis indica su propio nivel de certeza, para que decidas con criterio y no a ciegas.': "Chaque analyse indique son propre niveau de certitude, pour que vous décidiez avec discernement et non à l'aveugle.",
      'Ver un ejemplo →': 'Voir un exemple →',
      'Probar el Analyzer →': "Essayer l'Analyzer →",
      'Market Scanner: el mercado, escaneado en vivo.': 'Market Scanner : le marché, scanné en direct.',
      'El mismo motor de señal del Analyzer, pasado por los principales activos con datos reales — sin que la IA tenga que inventar nada si el mercado no da señales claras.': "Le même moteur de signal que l'Analyzer, appliqué aux principaux actifs avec des données réelles — sans que l'IA n'ait à inventer quoi que ce soit si le marché ne donne pas de signal clair.",
      'Recalculado al momento': "Recalculé à l'instant",
      'Cada vez que abres el Scanner se vuelve a calcular con los datos más recientes — no es una lista guardada de ayer.': "À chaque ouverture du Scanner, tout est recalculé avec les données les plus récentes — ce n'est jamais une liste enregistrée la veille.",
      'Ver el Scanner →': 'Voir le Scanner →',
      'Sin resultados de relleno': 'Pas de résultats de remplissage',
      'Si no hay datos de mercado fiables en ese momento, el Scanner lo dice claramente en vez de mostrar una lectura inventada.': "S'il n'y a pas de données de marché fiables à ce moment-là, le Scanner le dit clairement plutôt que d'afficher une lecture inventée.",
      'Vista previa del Scanner': 'Aperçu du Scanner',
      'Alcista': 'Haussier',
      'Lateral': 'Latéral',
      'Bajista': 'Baissier',
      'Sigue a traders y wallets': 'Suivez des traders et des wallets',
      'Modo simulado': 'Mode simulé',
      'Practica replicando estrategias ajenas dentro de tu propia cuenta de paper trading, sin arriesgar un euro real.': "Entraînez-vous en reproduisant les stratégies d'autres personnes dans votre propre compte de paper trading, sans risquer un seul euro réel.",
      'Wallet Tracker': 'Wallet Tracker',
      'Sigue la actividad de cualquier dirección y observa sus movimientos recientes.': "Suivez l'activité de n'importe quelle adresse et observez ses mouvements récents.",
      'Probar Wallet Tracker →': 'Essayer Wallet Tracker →',
      'Copy Trading simulado': 'Copy Trading simulé',
      'Copia automáticamente las operaciones de traders modelo dentro de tu saldo virtual.': 'Copiez automatiquement les opérations de traders modèles dans votre solde virtuel.',
      'Ver traders →': 'Voir les traders →',
      'Vista previa · Wallet Tracker (dirección de ejemplo)': "Aperçu · Wallet Tracker (adresse d'exemple)",
      'Vista previa · Trader modelo real de Copy Trading': 'Aperçu · Trader modèle réel du Copy Trading',
      'Sigue tendencias en BTC/ETH con gestión de riesgo ajustada.': 'Suit les tendances sur BTC/ETH avec une gestion des risques ajustée.',
      'acierto': 'de réussite',
      'Ver cómo funciona →': 'Voir comment ça marche →',

      'Tres planes, sin sorpresas.': 'Trois formules, sans surprises.',
      'Empieza gratis. Mejora cuando quieras más análisis y más herramientas.': "Commencez gratuitement. Passez à un forfait supérieur quand vous voulez plus d'analyses et plus d'outils.",
      'Gratis': 'Gratuit',
      '/ siempre': '/ pour toujours',
      '3 análisis con IA al día': '3 analyses IA par jour',
      'Paper Trading ilimitado': 'Paper Trading illimité',
      'Market Scanner en vivo': 'Market Scanner en direct',
      'Crear cuenta gratis': 'Créer un compte gratuit',
      'Cryptolyzer Pro': 'Cryptolyzer Pro',
      '/ mes': '/ mois',
      '15 análisis con IA al día': '15 analyses IA par jour',
      'Todo lo del plan gratis': 'Tout ce qui est dans le plan gratuit',
      'Elegir Pro': 'Choisir Pro',
      'Más popular': 'Le plus populaire',
      'Cryptolyzer Business': 'Cryptolyzer Business',
      'Análisis con IA ilimitados': 'Analyses IA illimitées',
      'Cancela cuando quieras': 'Annulez quand vous voulez',
      'Hazte Business': 'Passez en Business',
      'Cryptolyzer · Planes': 'Cryptolyzer · Formules',
      'Elige cómo quieres ': 'Choisissez comment vous voulez ',
      'analizar': 'analyser',
      'Empieza con lo esencial. Desbloquea todo el potencial de Cryptolyzer cuando estés preparado.': "Commencez par l'essentiel. Débloquez tout le potentiel de Cryptolyzer quand vous serez prêt.",
      'Pro': 'Pro',
      'Todo lo que necesitas para empezar a analizar el mercado con IA.': "Tout ce dont vous avez besoin pour commencer à analyser le marché avec l'IA.",
      '/mes': '/mois',
      'Análisis con IA al día': 'Analyses IA par jour',
      'Market Scanner': 'Market Scanner',
      'En vivo': 'En direct',
      'Empezar con Pro →': 'Commencer avec Pro →',
      'Business': 'Business',
      'Más potente': 'Le plus puissant',
      'Todas las herramientas. Sin límites. Lleva tu análisis al siguiente nivel.': 'Tous les outils. Sans limites. Passez votre analyse au niveau supérieur.',
      'Elegir Business →': 'Choisir Business →',

      'Preguntas frecuentes': 'Questions fréquentes',
      'Todo lo que ': 'Tout ce que vous ',
      'necesitas saber': 'devez savoir',
      'Resolvemos las dudas más comunes para que empieces a analizar el mercado con total confianza.': 'Nous répondons aux questions les plus fréquentes pour que vous puissiez commencer à analyser le marché en toute confiance.',
      '¿Tienes otra pregunta?': 'Vous avez une autre question ?',
      'Si no encuentras la respuesta que buscas, estamos aquí para ayudarte.': "Si vous ne trouvez pas la réponse que vous cherchez, nous sommes là pour vous aider.",
      'Contactar soporte →': 'Contacter le support →',
      '¿Es dinero real?': "Est-ce de l'argent réel ?",
      'No. Paper Trading, Wallet Tracker y Copy Trading funcionan con saldo virtual y datos simulados — puedes practicar sin arriesgar un euro real.': "Non. Paper Trading, Wallet Tracker et Copy Trading fonctionnent avec un solde virtuel et des données simulées — vous pouvez vous entraîner sans risquer un seul euro réel.",
      '¿El análisis de IA es real?': "L'analyse IA est-elle réelle ?",
      'Sí. El AI Market Analyzer usa un modelo de IA real para leer el gráfico que subas y generar el análisis — no son resultados de plantilla.': "Oui. L'AI Market Analyzer utilise un véritable modèle d'IA pour lire le graphique que vous importez et générer l'analyse — ce ne sont pas des résultats pré-fabriqués.",
      '¿Necesito experiencia previa?': "Ai-je besoin d'expérience préalable ?",
      'No. Cryptolyzer está pensado para aprender practicando, con una lectura clara en cada análisis y sin arriesgar dinero mientras coges soltura.': "Non. Cryptolyzer est pensé pour apprendre en pratiquant, avec une lecture claire à chaque analyse et sans risquer d'argent pendant que vous prenez de l'assurance.",
      '¿Qué pasa con mis datos?': 'Que deviennent mes données ?',
      'Tu email y contraseña se guardan de forma segura y nunca se comparten. Cryptolyzer nunca pide acceso a tus cuentas de exchange ni a tu dinero real.': "Votre e-mail et votre mot de passe sont stockés en toute sécurité et jamais partagés. Cryptolyzer ne demande jamais l'accès à vos comptes d'échange ni à votre argent réel.",
      '¿Puedo cancelar cuando quiera?': "Puis-je annuler quand je veux ?",
      'Sí. Puedes cancelar tu suscripción Pro en cualquier momento desde Ajustes, sin permanencia ni penalización.': 'Oui. Vous pouvez annuler votre abonnement Pro à tout moment depuis les Paramètres, sans engagement ni pénalité.',
      '¿Qué necesito para empezar?': 'De quoi ai-je besoin pour commencer ?',
      'Solo un email. Crea tu cuenta gratis y ya puedes subir tu primer gráfico en menos de un minuto.': "Juste un e-mail. Créez votre compte gratuit et importez votre premier graphique en moins d\'une minute.",

      '¿Listo para dejar de improvisar?': "Prêt à arrêter d'improviser ?",
      'Crea tu cuenta gratis y analiza tu primer gráfico en menos de un minuto.': "Créez votre compte gratuit et analysez votre premier graphique en moins d\'une minute.",
      'Crear cuenta gratis →': 'Créer un compte gratuit →',

      'Analiza el mercado con IA, practica sin riesgo y sigue a los mejores — todo en un solo sitio.': "Analysez le marché avec l\'IA, entraînez-vous sans risque et suivez les meilleurs — le tout au même endroit.",
      'Producto': 'Produit',
      'Herramientas': 'Outils',
      'Precio': 'Tarifs',
      'Cuenta': 'Compte',
      'Legal': 'Mentions légales',
      'Términos de uso': "Conditions d\'utilisation",
      'Privacidad': 'Confidentialité',
      'Cookies': 'Cookies',
      '© 2026 Cryptolyzer. Paper Trading, Wallet Tracker y Copy Trading funcionan en modo simulado — sin dinero real.': '© 2026 Cryptolyzer. Paper Trading, Wallet Tracker et Copy Trading fonctionnent en mode simulé — sans argent réel.',

      'Acceso a Cryptolyzer': 'Accès à Cryptolyzer',
      'Cerrar': 'Fermer',
      'Analiza. Practica. Sigue.': 'Analysez. Entraînez-vous. Suivez.',
      'Bienvenido de nuevo': 'Content de vous revoir',
      'Introduce tus datos para continuar.': 'Entrez vos informations pour continuer.',
      'Crea tu cuenta': 'Créez votre compte',
      'Empieza en menos de un minuto.': "Commencez en moins d\'une minute.",
      'Crear cuenta': 'Créer un compte',
      'Email': 'E-mail',
      'Contraseña': 'Mot de passe',
      'Mostrar contraseña': 'Afficher le mot de passe',
      'Ocultar contraseña': 'Masquer le mot de passe',
      'Entrar': 'Se connecter',
      'Entrando…': 'Connexion…',
      'Nombre': 'Nom',
      'Tu nombre': 'Votre nom',
      'Creando cuenta…': 'Création du compte…',
      'Al continuar, aceptas nuestros ': 'En continuant, vous acceptez nos ',
      'Términos': 'Conditions',
      ' y ': ' et notre ',
      'Política de privacidad': 'Politique de confidentialité',

      'Detalles del plan': 'Détails du forfait',
      'Crear cuenta y continuar →': 'Créer un compte et continuer →',
      'Pago seguro con Stripe. Cancela cuando quieras desde tu cuenta.': 'Paiement sécurisé avec Stripe. Annulez quand vous voulez depuis votre compte.',

      'Nueva cuenta creada en Cryptolyzer': 'Nouveau compte créé sur Cryptolyzer',
      'Alguien acaba de analizar un gráfico con IA': "Quelqu'un vient d'analyser un graphique avec l'IA",
      'Se abrió una posición en Paper Trading': 'Une position a été ouverte en Paper Trading',
      'Se cerró una posición en Paper Trading': 'Une position a été fermée en Paper Trading',
      'justo ahora': "à l'instant",
      '😢 Por favor, vuelve': "😢 Revenez, s\'il vous plaît",

      // Fase 2 — navegación compartida (sidebar/topbar/modales)
      'Inicio': 'Accueil',
      'Historial': 'Historique',
      'Estado de conexión': 'État de la connexion',
      'En línea': 'En ligne',
      'Sin conexión': 'Hors ligne',
      'Ajustes': 'Paramètres',
      'Cerrar sesión': 'Se déconnecter',
      'Navegación': 'Navigation',
      'Perfil': 'Profil',
      'Todavía no has añadido una biografía.': "Vous n'avez pas encore ajouté de bio.",
      'Plan gratuito': 'Formule gratuite',
      'Editar perfil': 'Modifier le profil',
      'Cambiar foto de perfil': 'Changer la photo de profil',
      'Mejora tu plan': 'Améliorez votre forfait',
      'Elegir Business': 'Choisir Business',
      'Suscripción con renovación automática mensual hasta que la canceles. Se te cobrará el importe mostrado hoy y el mismo importe en cada renovación. Puedes cancelar la renovación en cualquier momento desde "Suscripción y facturación" — seguirás teniendo acceso hasta el final del periodo ya pagado. Ver': "Abonnement avec renouvellement automatique mensuel jusqu'à son annulation. Le montant affiché aujourd'hui vous sera facturé, ainsi que le même montant à chaque renouvellement. Vous pouvez annuler le renouvellement à tout moment depuis « Abonnement et facturation » — vous conserverez l'accès jusqu'à la fin de la période déjà payée. Voir",
      'cancelación y reembolsos': 'annulation et remboursements',
      'Un momento…': 'Un instant…',
      'Cambiar foto': 'Changer la photo',
      'Quitar foto': 'Supprimer la photo',
      'Biografía': 'Bio',
      'Cuenta algo sobre ti (opcional)': 'Dites-nous quelque chose sur vous (facultatif)',
      'Plan actual:': 'Formule actuelle :',
      'Gratuito': 'Gratuit',
      'Mejorar plan': 'Améliorer la formule',
      'Suscripción y facturación': 'Abonnement et facturation',
      'Guardar': 'Enregistrer',
      'Cancelar': 'Annuler',
      'El nombre no puede estar vacío.': 'Le nom ne peut pas être vide.',
      'Guardando…': 'Enregistrement…',
      'Ajustes guardados.': 'Paramètres enregistrés.',
      'No se pudo actualizar la foto.': 'Impossible de mettre à jour la photo.',
      'Foto de perfil actualizada.': 'Photo de profil mise à jour.',
      'Entendido': 'Compris',
    },

    de: {
      'El AI Market Analyzer ya está disponible': 'Der AI Market Analyzer ist jetzt verfügbar',
      'Cerrar aviso': 'Hinweis schließen',
      'Funciones': 'Funktionen',
      'Cómo funciona': 'So funktioniert es',
      'FAQ': 'FAQ',
      'Analizar un gráfico →': 'Chart analysieren →',
      'Iniciar sesión': 'Anmelden',
      'Saltar intro': 'Intro überspringen',

      'Sesgo, escenarios y niveles — nunca una certeza inventada': 'Bias, Szenarien und Niveaus — niemals eine erfundene Gewissheit',
      'Lee el mercado.': 'Lies den Markt.',
      'Antes de que se mueva.': 'Bevor er sich bewegt.',
      'El analizador de IA para leer el mercado antes de operar.': 'Der KI-Analyzer, der den Markt liest, bevor du handelst.',
      'Sube cualquier gráfico y deja que la IA detecte patrones, niveles y contexto en segundos — sin ruido, sin adivinar.': 'Lade einen beliebigen Chart hoch und lass die KI in Sekunden Muster, Niveaus und Kontext erkennen — ohne Rauschen, ohne Raten.',
      'Analizar mi gráfico →': 'Meinen Chart analysieren →',
      'Análisis con IA real': 'Analyse mit echter KI',
      'Gratis para empezar': 'Kostenlos starten',
      'Sin arriesgar dinero real': 'Ohne echtes Geld zu riskieren',
      'IA analizando': 'KI analysiert',
      'Análisis IA': 'KI-Analyse',
      'Tendencia alcista': 'Aufwärtstrend',
      'Confianza': 'Konfidenz',
      'Resistencia': 'Widerstand',
      'Precio actual': 'Aktueller Preis',
      'Soporte': 'Unterstützung',
      'Vista previa ilustrativa — así se ve un análisis real dentro de la app. No es una recomendación de inversión.': 'Illustrative Vorschau — so sieht eine echte Analyse in der App aus. Keine Anlageberatung.',

      'Empieza a analizar gratis': 'Jetzt kostenlos analysieren',
      'Tu gráfico.': 'Dein Chart.',
      'Explicado por IA.': 'Von KI erklärt.',
      'Sube cualquier gráfico y deja que la IA lo convierta en soportes, resistencias y contexto claro — en segundos.': 'Lade einen beliebigen Chart hoch und lass die KI ihn in Sekunden in Unterstützung, Widerstand und klaren Kontext verwandeln.',
      'Sin tarjeta': 'Keine Kreditkarte nötig',
      'Análisis con IA': 'KI-Analyse',
      'Empieza gratis': 'Kostenlos starten',
      'Actualizado hace 2s': 'Vor 2s aktualisiert',
      'Ruptura alcista': 'Bullischer Ausbruch',
      'Vista previa con datos de ejemplo — no es una recomendación de inversión.': 'Vorschau mit Beispieldaten — keine Anlageberatung.',

      'La app': 'Die App',
      'Todo lo que necesitas,': 'Alles, was du brauchst,',
      'en un solo lugar.': 'an einem Ort.',
      'Accede a todas las herramientas de Cryptolyzer en una experiencia rápida, intuitiva y diseñada para traders de todos los niveles.': 'Nutze alle Cryptolyzer-Tools in einer schnellen, intuitiven Erfahrung für Trader jeder Erfahrungsstufe.',
      'Rápida': 'Schnell',
      'Analiza y actúa en segundos.': 'Analysiere und handle in Sekunden.',
      'Segura': 'Sicher',
      'Tus datos siempre protegidos.': 'Deine Daten sind immer geschützt.',
      'En cualquier dispositivo': 'Auf jedem Gerät',
      'Desde el navegador, sin instalar nada.': 'Direkt im Browser, nichts zu installieren.',
      'Gráficos avanzados': 'Fortgeschrittene Charts',
      'Herramientas profesionales para un análisis más preciso.': 'Professionelle Tools für eine präzisere Analyse.',
      'IA integrada': 'Integrierte KI',
      'Obtén análisis claros y accionables en segundos.': 'Erhalte klare, umsetzbare Analysen in Sekunden.',
      'Múltiples mercados': 'Mehrere Märkte',
      'Cripto, acciones, forex y más.': 'Krypto, Aktien, Forex und mehr.',
      'Alertas y notificaciones': 'Warnungen und Benachrichtigungen',
      'No te pierdas ninguna oportunidad.': 'Verpasse keine Gelegenheit.',
      'Disponible en cualquier dispositivo': 'Auf jedem Gerät verfügbar',
      'Sin descargas — accede desde el navegador.': 'Kein Download — direkt im Browser nutzbar.',
      'Escritorio': 'Desktop',
      'Móvil': 'Mobil',
      'Nueva señal disponible': 'Neues Signal verfügbar',
      'Buscar un activo, símbolo o mercado…': 'Asset, Symbol oder Markt suchen…',
      'Análisis de IA': 'KI-Analyse',
      'Hace 2 min': 'Vor 2 Min.',
      'Momentum positivo': 'Positives Momentum',
      'Riesgo medio': 'Mittleres Risiko',
      'Ver análisis completo →': 'Vollständige Analyse ansehen →',
      'Explora todos los mercados': 'Alle Märkte erkunden',
      'Más activos, más oportunidades.': 'Mehr Assets, mehr Chancen.',
      'Vista ilustrativa de la interfaz de Cryptolyzer, con datos de ejemplo — no es una recomendación de inversión.': 'Illustrative Ansicht der Cryptolyzer-Oberfläche mit Beispieldaten — keine Anlageberatung.',

      'Cómo funciona Cryptolyzer': 'So funktioniert Cryptolyzer',
      'Del gráfico a una decisión clara.': 'Vom Chart zu einer klaren Entscheidung.',
      'Cryptolyzer analiza tu gráfico, identifica las señales relevantes y transforma los datos en una lectura sencilla del mercado.': 'Cryptolyzer analysiert deinen Chart, erkennt die relevanten Signale und verwandelt die Daten in eine einfache Markteinschätzung.',
      'Gráfico': 'Chart',
      'Analizando señales': 'Signale werden analysiert',
      'Resultado': 'Ergebnis',
      'COMPRAR': 'KAUFEN',
      'Riesgo': 'Risiko',
      'Medio': 'Mittel',
      'Vista ilustrativa de cómo se ve un análisis dentro de la app — no es una recomendación de inversión.': 'Illustrative Ansicht, wie eine Analyse in der App aussieht — keine Anlageberatung.',
      'Probar el AI Analyzer gratis →': 'AI Analyzer kostenlos testen →',

      'Nuevo · Memecoins': 'Neu · Memecoins',
      'Ahora también con ': 'Jetzt auch mit ',
      'Amplía tus análisis con Cryptolyzer AI y explora nuevas oportunidades del mercado — mismo motor, mismo rigor técnico, sin tener que esperar a que una moneda nueva "se añada" a mano.': 'Erweitere deine Analysen mit Cryptolyzer AI und entdecke neue Marktchancen — gleiche Engine, gleiche technische Sorgfalt, ohne darauf zu warten, dass eine neue Münze manuell „hinzugefügt“ wird.',
      'Búsqueda real': 'Echte Suche',
      'Encuentra DOGE, SHIB, PEPE y cientos más por nombre o símbolo.': 'Finde DOGE, SHIB, PEPE und Hunderte weitere nach Name oder Symbol.',
      'Sin datos inventados': 'Keine erfundenen Daten',
      'Si un dato de mercado no está disponible, Cryptolyzer te lo dice — nunca lo simula.': 'Wenn ein Marktdatum nicht verfügbar ist, sagt dir Cryptolyzer das — es simuliert es niemals.',
      'Analizar una memecoin →': 'Eine Memecoin analysieren →',
      'Momentum alcista': 'Bullisches Momentum',
      'Datos de ejemplo con fines ilustrativos — Cryptolyzer nunca inventa precios ni métricas de mercado reales.': 'Beispieldaten zu Illustrationszwecken — Cryptolyzer erfindet niemals echte Marktpreise oder -kennzahlen.',

      'Todo lo que necesitas para operar sin miedo a equivocarte.': 'Alles, was du brauchst, um zu handeln, ohne Angst vor Fehlern.',
      'Un analizador de gráficos, picks diarios y un simulador completo de trading — todo dentro de la misma cuenta.': 'Ein Chart-Analyzer, tägliche Picks und ein vollständiger Trading-Simulator — alles in einem Konto.',
      'El analizador de gráficos que nunca duerme.': 'Der Chart-Analyzer, der nie schläft.',
      'Sube cualquier captura y obtén soportes, resistencias y una lectura de confianza al instante, para cualquier mercado.': 'Lade einen beliebigen Screenshot hoch und erhalte sofort Unterstützung, Widerstand und eine Konfidenzeinschätzung für jeden Markt.',
      'Funciona con cualquier mercado': 'Funktioniert mit jedem Markt',
      'Cripto, forex o acciones — sube la imagen del gráfico y listo, sin conectar ninguna cuenta.': 'Krypto, Forex oder Aktien — lade das Chart-Bild hoch, fertig, ohne ein Konto zu verbinden.',
      'Probarlo →': 'Ausprobieren →',
      'Resultados con confianza real': 'Ergebnisse mit echter Konfidenz',
      'Cada análisis indica su propio nivel de certeza, para que decidas con criterio y no a ciegas.': 'Jede Analyse zeigt ihr eigenes Konfidenzniveau, damit du mit Urteilsvermögen entscheidest und nicht blind.',
      'Ver un ejemplo →': 'Ein Beispiel ansehen →',
      'Probar el Analyzer →': 'Analyzer testen →',
      'Market Scanner: el mercado, escaneado en vivo.': 'Market Scanner: der Markt, live gescannt.',
      'El mismo motor de señal del Analyzer, pasado por los principales activos con datos reales — sin que la IA tenga que inventar nada si el mercado no da señales claras.': 'Dieselbe Signal-Engine wie der Analyzer, angewendet auf die wichtigsten Assets mit echten Daten — ohne dass die KI etwas erfinden muss, wenn der Markt kein klares Signal gibt.',
      'Recalculado al momento': 'Sofort neu berechnet',
      'Cada vez que abres el Scanner se vuelve a calcular con los datos más recientes — no es una lista guardada de ayer.': 'Jedes Mal, wenn du den Scanner öffnest, wird mit den aktuellsten Daten neu berechnet — niemals eine von gestern gespeicherte Liste.',
      'Ver el Scanner →': 'Scanner ansehen →',
      'Sin resultados de relleno': 'Keine Füll-Ergebnisse',
      'Si no hay datos de mercado fiables en ese momento, el Scanner lo dice claramente en vez de mostrar una lectura inventada.': 'Wenn gerade keine zuverlässigen Marktdaten vorliegen, sagt der Scanner das klar, statt eine erfundene Einschätzung zu zeigen.',
      'Vista previa del Scanner': 'Scanner-Vorschau',
      'Alcista': 'Bullisch',
      'Lateral': 'Seitwärts',
      'Bajista': 'Bärisch',
      'Sigue a traders y wallets': 'Folge Tradern und Wallets',
      'Modo simulado': 'Simulierter Modus',
      'Practica replicando estrategias ajenas dentro de tu propia cuenta de paper trading, sin arriesgar un euro real.': 'Übe, indem du fremde Strategien in deinem eigenen Paper-Trading-Konto nachbildest, ohne einen einzigen echten Euro zu riskieren.',
      'Wallet Tracker': 'Wallet Tracker',
      'Sigue la actividad de cualquier dirección y observa sus movimientos recientes.': 'Verfolge die Aktivität einer beliebigen Adresse und beobachte ihre letzten Bewegungen.',
      'Probar Wallet Tracker →': 'Wallet Tracker testen →',
      'Copy Trading simulado': 'Simuliertes Copy Trading',
      'Copia automáticamente las operaciones de traders modelo dentro de tu saldo virtual.': 'Kopiere automatisch die Trades von Vorbild-Tradern in deinem virtuellen Guthaben.',
      'Ver traders →': 'Trader ansehen →',
      'Vista previa · Wallet Tracker (dirección de ejemplo)': 'Vorschau · Wallet Tracker (Beispieladresse)',
      'Vista previa · Trader modelo real de Copy Trading': 'Vorschau · Echter Vorbild-Trader aus dem Copy Trading',
      'Sigue tendencias en BTC/ETH con gestión de riesgo ajustada.': 'Folgt Trends bei BTC/ETH mit angepasstem Risikomanagement.',
      'acierto': 'Trefferquote',
      'Ver cómo funciona →': 'Ansehen, wie es funktioniert →',

      'Tres planes, sin sorpresas.': 'Drei Pläne, keine Überraschungen.',
      'Empieza gratis. Mejora cuando quieras más análisis y más herramientas.': 'Starte kostenlos. Upgrade, wenn du mehr Analysen und mehr Tools willst.',
      'Gratis': 'Kostenlos',
      '/ siempre': '/ für immer',
      '3 análisis con IA al día': '3 KI-Analysen pro Tag',
      'Paper Trading ilimitado': 'Unbegrenztes Paper Trading',
      'Market Scanner en vivo': 'Live Market Scanner',
      'Crear cuenta gratis': 'Kostenloses Konto erstellen',
      'Cryptolyzer Pro': 'Cryptolyzer Pro',
      '/ mes': '/ Monat',
      '15 análisis con IA al día': '15 KI-Analysen pro Tag',
      'Todo lo del plan gratis': 'Alles aus dem kostenlosen Plan',
      'Elegir Pro': 'Pro wählen',
      'Más popular': 'Am beliebtesten',
      'Cryptolyzer Business': 'Cryptolyzer Business',
      'Análisis con IA ilimitados': 'Unbegrenzte KI-Analysen',
      'Cancela cuando quieras': 'Jederzeit kündbar',
      'Hazte Business': 'Zu Business wechseln',
      'Cryptolyzer · Planes': 'Cryptolyzer · Pläne',
      'Elige cómo quieres ': 'Wähle, wie du ',
      'analizar': 'analysieren möchtest',
      'Empieza con lo esencial. Desbloquea todo el potencial de Cryptolyzer cuando estés preparado.': 'Starte mit dem Wesentlichen. Schalte das volle Potenzial von Cryptolyzer frei, wenn du bereit bist.',
      'Pro': 'Pro',
      'Todo lo que necesitas para empezar a analizar el mercado con IA.': 'Alles, was du brauchst, um den Markt mit KI zu analysieren.',
      '/mes': '/Monat',
      'Análisis con IA al día': 'KI-Analysen pro Tag',
      'Market Scanner': 'Market Scanner',
      'En vivo': 'Live',
      'Empezar con Pro →': 'Mit Pro starten →',
      'Business': 'Business',
      'Más potente': 'Am leistungsstärksten',
      'Todas las herramientas. Sin límites. Lleva tu análisis al siguiente nivel.': 'Alle Tools. Keine Limits. Bring deine Analyse auf das nächste Level.',
      'Elegir Business →': 'Business wählen →',

      'Preguntas frecuentes': 'Häufige Fragen',
      'Todo lo que ': 'Alles, was du ',
      'necesitas saber': 'wissen musst',
      'Resolvemos las dudas más comunes para que empieces a analizar el mercado con total confianza.': 'Wir beantworten die häufigsten Fragen, damit du den Markt mit vollem Vertrauen analysieren kannst.',
      '¿Tienes otra pregunta?': 'Hast du eine andere Frage?',
      'Si no encuentras la respuesta que buscas, estamos aquí para ayudarte.': 'Wenn du die gesuchte Antwort nicht findest, sind wir hier, um zu helfen.',
      'Contactar soporte →': 'Support kontaktieren →',
      '¿Es dinero real?': 'Ist es echtes Geld?',
      'No. Paper Trading, Wallet Tracker y Copy Trading funcionan con saldo virtual y datos simulados — puedes practicar sin arriesgar un euro real.': 'Nein. Paper Trading, Wallet Tracker und Copy Trading laufen mit virtuellem Guthaben und simulierten Daten — du kannst üben, ohne einen einzigen echten Euro zu riskieren.',
      '¿El análisis de IA es real?': 'Ist die KI-Analyse echt?',
      'Sí. El AI Market Analyzer usa un modelo de IA real para leer el gráfico que subas y generar el análisis — no son resultados de plantilla.': 'Ja. Der AI Market Analyzer nutzt ein echtes KI-Modell, um den von dir hochgeladenen Chart zu lesen und die Analyse zu erstellen — keine Vorlagenergebnisse.',
      '¿Necesito experiencia previa?': 'Brauche ich Vorerfahrung?',
      'No. Cryptolyzer está pensado para aprender practicando, con una lectura clara en cada análisis y sin arriesgar dinero mientras coges soltura.': 'Nein. Cryptolyzer ist dafür gedacht, durch Üben zu lernen, mit einer klaren Einschätzung bei jeder Analyse und ohne Geld zu riskieren, während du Sicherheit gewinnst.',
      '¿Qué pasa con mis datos?': 'Was passiert mit meinen Daten?',
      'Tu email y contraseña se guardan de forma segura y nunca se comparten. Cryptolyzer nunca pide acceso a tus cuentas de exchange ni a tu dinero real.': 'Deine E-Mail und dein Passwort werden sicher gespeichert und nie weitergegeben. Cryptolyzer fragt niemals nach Zugriff auf deine Exchange-Konten oder dein echtes Geld.',
      '¿Puedo cancelar cuando quiera?': 'Kann ich jederzeit kündigen?',
      'Sí. Puedes cancelar tu suscripción Pro en cualquier momento desde Ajustes, sin permanencia ni penalización.': 'Ja. Du kannst dein Pro-Abo jederzeit in den Einstellungen kündigen, ohne Mindestlaufzeit oder Strafgebühr.',
      '¿Qué necesito para empezar?': 'Was brauche ich, um loszulegen?',
      'Solo un email. Crea tu cuenta gratis y ya puedes subir tu primer gráfico en menos de un minuto.': 'Nur eine E-Mail. Erstelle dein kostenloses Konto und lade deinen ersten Chart in weniger als einer Minute hoch.',

      '¿Listo para dejar de improvisar?': 'Bereit, nicht mehr zu improvisieren?',
      'Crea tu cuenta gratis y analiza tu primer gráfico en menos de un minuto.': 'Erstelle dein kostenloses Konto und analysiere deinen ersten Chart in weniger als einer Minute.',
      'Crear cuenta gratis →': 'Kostenloses Konto erstellen →',

      'Analiza el mercado con IA, practica sin riesgo y sigue a los mejores — todo en un solo sitio.': 'Analysiere den Markt mit KI, übe risikofrei und folge den Besten — alles an einem Ort.',
      'Producto': 'Produkt',
      'Herramientas': 'Tools',
      'Precio': 'Preise',
      'Cuenta': 'Konto',
      'Legal': 'Rechtliches',
      'Términos de uso': 'Nutzungsbedingungen',
      'Privacidad': 'Datenschutz',
      'Cookies': 'Cookies',
      '© 2026 Cryptolyzer. Paper Trading, Wallet Tracker y Copy Trading funcionan en modo simulado — sin dinero real.': '© 2026 Cryptolyzer. Paper Trading, Wallet Tracker und Copy Trading laufen im simulierten Modus — ohne echtes Geld.',

      'Acceso a Cryptolyzer': 'Zugang zu Cryptolyzer',
      'Cerrar': 'Schließen',
      'Analiza. Practica. Sigue.': 'Analysiere. Übe. Folge.',
      'Bienvenido de nuevo': 'Willkommen zurück',
      'Introduce tus datos para continuar.': 'Gib deine Daten ein, um fortzufahren.',
      'Crea tu cuenta': 'Erstelle dein Konto',
      'Empieza en menos de un minuto.': 'Starte in weniger als einer Minute.',
      'Crear cuenta': 'Konto erstellen',
      'Email': 'E-Mail',
      'Contraseña': 'Passwort',
      'Mostrar contraseña': 'Passwort anzeigen',
      'Ocultar contraseña': 'Passwort verbergen',
      'Entrar': 'Anmelden',
      'Entrando…': 'Anmeldung läuft…',
      'Nombre': 'Name',
      'Tu nombre': 'Dein Name',
      'Creando cuenta…': 'Konto wird erstellt…',
      'Al continuar, aceptas nuestros ': 'Mit der Fortsetzung akzeptierst du unsere ',
      'Términos': 'Nutzungsbedingungen',
      ' y ': ' und unsere ',
      'Política de privacidad': 'Datenschutzerklärung',

      'Detalles del plan': 'Plan-Details',
      'Crear cuenta y continuar →': 'Konto erstellen und fortfahren →',
      'Pago seguro con Stripe. Cancela cuando quieras desde tu cuenta.': 'Sichere Zahlung mit Stripe. Jederzeit über dein Konto kündbar.',

      'Nueva cuenta creada en Cryptolyzer': 'Neues Konto bei Cryptolyzer erstellt',
      'Alguien acaba de analizar un gráfico con IA': 'Jemand hat gerade einen Chart mit KI analysiert',
      'Se abrió una posición en Paper Trading': 'Eine Position wurde im Paper Trading eröffnet',
      'Se cerró una posición en Paper Trading': 'Eine Position wurde im Paper Trading geschlossen',
      'justo ahora': 'gerade eben',
      '😢 Por favor, vuelve': '😢 Bitte komm zurück',

      // Fase 2 — navegación compartida (sidebar/topbar/modales)
      'Inicio': 'Start',
      'Historial': 'Verlauf',
      'Estado de conexión': 'Verbindungsstatus',
      'En línea': 'Online',
      'Sin conexión': 'Offline',
      'Ajustes': 'Einstellungen',
      'Cerrar sesión': 'Abmelden',
      'Navegación': 'Navigation',
      'Perfil': 'Profil',
      'Todavía no has añadido una biografía.': 'Du hast noch keine Biografie hinzugefügt.',
      'Plan gratuito': 'Kostenloser Plan',
      'Editar perfil': 'Profil bearbeiten',
      'Cambiar foto de perfil': 'Profilbild ändern',
      'Mejora tu plan': 'Upgrade deinen Plan',
      'Elegir Business': 'Business wählen',
      'Suscripción con renovación automática mensual hasta que la canceles. Se te cobrará el importe mostrado hoy y el mismo importe en cada renovación. Puedes cancelar la renovación en cualquier momento desde "Suscripción y facturación" — seguirás teniendo acceso hasta el final del periodo ya pagado. Ver': 'Monatliches Abo mit automatischer Verlängerung, bis du es kündigst. Dir wird der heute angezeigte Betrag berechnet, und derselbe Betrag bei jeder Verlängerung. Du kannst die Verlängerung jederzeit über "Abo & Abrechnung" kündigen — du behältst den Zugang bis zum Ende des bereits bezahlten Zeitraums. Siehe',
      'cancelación y reembolsos': 'Kündigung und Rückerstattungen',
      'Un momento…': 'Einen Moment…',
      'Cambiar foto': 'Foto ändern',
      'Quitar foto': 'Foto entfernen',
      'Biografía': 'Biografie',
      'Cuenta algo sobre ti (opcional)': 'Erzähl etwas über dich (optional)',
      'Plan actual:': 'Aktueller Plan:',
      'Gratuito': 'Kostenlos',
      'Mejorar plan': 'Plan upgraden',
      'Suscripción y facturación': 'Abo & Abrechnung',
      'Guardar': 'Speichern',
      'Cancelar': 'Abbrechen',
      'El nombre no puede estar vacío.': 'Der Name darf nicht leer sein.',
      'Guardando…': 'Wird gespeichert…',
      'Ajustes guardados.': 'Einstellungen gespeichert.',
      'No se pudo actualizar la foto.': 'Das Foto konnte nicht aktualisiert werden.',
      'Foto de perfil actualizada.': 'Profilbild aktualisiert.',
      'Entendido': 'Verstanden',
    },
  };

  // Claves PARAMÉTRICAS (con variables) — usadas vía window.i18n.t(key, vars)
  // desde el propio JS de cada página en vez del calco automático de texto.
  const PARAM_DICTS = {
    en: {
      analysisWithSymbol: 'Someone just analyzed {symbol} with AI',
      openedWithSymbol: 'A {symbol} position was opened in Paper Trading',
      closedWithSymbol: 'A {symbol} position was closed in Paper Trading',
      minutesAgo: '{n} min ago',
      hoursAgo: '{n}h ago',
      daysAgo: '{n}d ago',
      accountsCreated: '+{n} accounts already created on Cryptolyzer',
      peopleUsing: '+{n} people already use Cryptolyzer',
      viewProfileOf: 'View profile of {name}',
    },
    pt: {
      analysisWithSymbol: 'Alguém acabou de analisar {symbol} com IA',
      openedWithSymbol: 'Uma posição de {symbol} foi aberta no Paper Trading',
      closedWithSymbol: 'Uma posição de {symbol} foi fechada no Paper Trading',
      minutesAgo: 'há {n} min',
      hoursAgo: 'há {n}h',
      daysAgo: 'há {n}d',
      accountsCreated: '+{n} contas já criadas na Cryptolyzer',
      peopleUsing: '+{n} pessoas já usam a Cryptolyzer',
      viewProfileOf: 'Ver perfil de {name}',
    },
    fr: {
      analysisWithSymbol: "Quelqu'un vient d'analyser {symbol} avec l'IA",
      openedWithSymbol: 'Une position {symbol} a été ouverte en Paper Trading',
      closedWithSymbol: 'Une position {symbol} a été fermée en Paper Trading',
      minutesAgo: 'il y a {n} min',
      hoursAgo: 'il y a {n}h',
      daysAgo: 'il y a {n}j',
      accountsCreated: '+{n} comptes déjà créés sur Cryptolyzer',
      peopleUsing: '+{n} personnes utilisent déjà Cryptolyzer',
      viewProfileOf: 'Voir le profil de {name}',
    },
    de: {
      analysisWithSymbol: 'Jemand hat gerade {symbol} mit KI analysiert',
      openedWithSymbol: 'Eine {symbol}-Position wurde im Paper Trading eröffnet',
      closedWithSymbol: 'Eine {symbol}-Position wurde im Paper Trading geschlossen',
      minutesAgo: 'vor {n} Min.',
      hoursAgo: 'vor {n}h',
      daysAgo: 'vor {n}T',
      accountsCreated: '+{n} Konten bereits bei Cryptolyzer erstellt',
      peopleUsing: '+{n} Personen nutzen bereits Cryptolyzer',
      viewProfileOf: 'Profil von {name} ansehen',
    },
  };

  // ---------------------------------------------------------------------
  // Motor
  // ---------------------------------------------------------------------
  const TEXT_ORIGINAL = new WeakMap();
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);
  // `data-label` se suma a los atributos "normales" porque el sidebar
  // compacto (shared/sidebar.js) no pinta el nombre de cada sección como
  // texto real — lo expone vía CSS con `content: attr(data-label)` en un
  // tooltip. Sin traducir también este atributo, el tooltip se quedaba
  // en español aunque el resto de la app ya hubiera cambiado de idioma.
  const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label', 'data-label'];

  function getLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch { /* localStorage no disponible (privado/bloqueado) */ }
    return 'es';
  }

  function collectTextNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n = root.nodeType === Node.TEXT_NODE ? root : walker.nextNode();
    if (root.nodeType === Node.TEXT_NODE) {
      nodes.push(root);
    } else {
      while (n) { nodes.push(n); n = walker.nextNode(); }
    }
    return nodes;
  }

  // Normaliza espacios para la BÚSQUEDA en el diccionario (colapsa
  // saltos de línea/indentación de un template literal multilínea a un
  // único espacio) — el HTML no colapsa eso en el nodo de texto real,
  // solo al pintarlo, así que sin esto un párrafo escrito en varias
  // líneas en el código nunca encontraría su clave. Las claves del
  // diccionario se escriben siempre ya normalizadas (un solo espacio).
  function normalizeForLookup(str) {
    return str.replace(/\s+/g, ' ').trim();
  }

  function translateTextNode(node, lang, dict) {
    if (!TEXT_ORIGINAL.has(node)) TEXT_ORIGINAL.set(node, node.nodeValue);
    const original = TEXT_ORIGINAL.get(node);
    const normalized = normalizeForLookup(original);
    if (!normalized) return;
    if (lang === 'es') { node.nodeValue = original; return; }
    const translated = dict[normalized];
    if (translated == null) { node.nodeValue = original; return; }
    const leading = original.match(/^\s*/)[0];
    const trailing = original.match(/\s*$/)[0];
    node.nodeValue = leading + translated + trailing;
  }

  function translateElementAttrs(el, lang, dict) {
    TRANSLATABLE_ATTRS.forEach((attr) => {
      if (!el.hasAttribute(attr)) return;
      const origAttrName = `data-i18n-orig-${attr}`;
      if (!el.hasAttribute(origAttrName)) el.setAttribute(origAttrName, el.getAttribute(attr));
      const original = el.getAttribute(origAttrName);
      if (lang === 'es') { el.setAttribute(attr, original); return; }
      const translated = dict[normalizeForLookup(original)];
      el.setAttribute(attr, translated != null ? translated : original);
    });
  }

  function applyTranslations(lang, root) {
    const scope = root || document.body;
    if (!scope) return;
    const dict = DICTS[lang] || {};
    collectTextNodes(scope).forEach((node) => translateTextNode(node, lang, dict));
    const elements = scope.nodeType === Node.ELEMENT_NODE
      ? [scope, ...scope.querySelectorAll('*')]
      : [...(scope.parentElement ? [scope.parentElement] : [])];
    elements.forEach((el) => translateElementAttrs(el, lang, dict));
  }

  // Para texto paramétrico (con un número/símbolo dentro, p.ej.
  // "+42 cuentas ya creadas") el calco automático de texto no sirve —
  // cada página construye igualmente su frase en español como fallback
  // (tercer argumento) y t() la sustituye solo si hay traducción real
  // para el idioma activo; en español, o si falta la clave, se devuelve
  // tal cual el fallback.
  function t(key, vars, fallback) {
    const lang = getLang();
    if (lang === 'es') return fallback != null ? fallback : '';
    const dict = PARAM_DICTS[lang];
    let str = (dict && dict[key]) || null;
    if (!str) return fallback != null ? fallback : '';
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
      });
    }
    return str;
  }

  let observer = null;
  function ensureObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver((mutations) => {
      const lang = getLang();
      if (lang === 'es') return; // nada que traducir, el DOM ya nace en español
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
            applyTranslations(lang, node);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignorar */ }
    applyTranslations(lang, document.body);
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang-switch]').forEach(updateSwitchUI);
    document.dispatchEvent(new CustomEvent('cryptolyzer:langchange', { detail: { lang } }));
  }

  function updateSwitchUI(container) {
    const current = getLang();
    const btn = container.querySelector('[data-lang-current]');
    if (btn) btn.textContent = LANG_LABELS[current].short;
    container.querySelectorAll('[data-lang-option]').forEach((opt) => {
      opt.classList.toggle('is-active', opt.dataset.langOption === current);
      opt.setAttribute('aria-selected', String(opt.dataset.langOption === current));
    });
  }

  // Monta un selector de idioma compacto (ES/EN/PT/FR/DE) dentro de
  // `container`. Mismo componente reutilizado en el nav público y, en
  // fases siguientes, en la cabecera de la app autenticada.
  function mountLanguageSwitcher(container) {
    if (!container || container.querySelector('[data-lang-switch]')) return;
    const wrap = document.createElement('div');
    wrap.className = 'lang-switch';
    wrap.setAttribute('data-lang-switch', '');
    wrap.innerHTML = `
      <button type="button" class="lang-switch__btn" data-lang-toggle aria-haspopup="true" aria-expanded="false" aria-label="Cambiar idioma / Change language">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.6 3.8 5.8 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.8-3.8-9s1.3-6.4 3.8-9Z" /></svg>
        <span data-lang-current>ES</span>
      </button>
      <div class="lang-switch__menu" data-lang-menu role="listbox" hidden>
        ${SUPPORTED.map((code) => `<button type="button" class="lang-switch__option" role="option" data-lang-option="${code}">${LANG_LABELS[code].name}</button>`).join('')}
      </div>
    `;
    container.appendChild(wrap);
    const menu = wrap.querySelector('[data-lang-menu]');
    const toggleBtn = wrap.querySelector('[data-lang-toggle]');
    function closeMenu() {
      menu.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = menu.hidden;
      menu.hidden = !willOpen;
      toggleBtn.setAttribute('aria-expanded', String(willOpen));
    });
    wrap.querySelectorAll('[data-lang-option]').forEach((opt) => {
      opt.addEventListener('click', () => {
        setLang(opt.dataset.langOption);
        closeMenu();
      });
    });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    updateSwitchUI(wrap);
  }

  function init() {
    ensureObserver();
    const lang = getLang();
    if (lang !== 'es') applyTranslations(lang, document.body);
    document.documentElement.lang = lang;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.i18n = { getLang, setLang, applyTranslations, mountLanguageSwitcher, t, SUPPORTED, LANG_LABELS };
})();
