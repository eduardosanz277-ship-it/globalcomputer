export const es = {
  login: {
    heading: {
      title: "Iniciar sesión",
      description: "Accede con tu correo electrónico.",
    },
    emailLabel: "Correo electrónico",
    codeLabel: "Código de verificación",
    codeSentPrefix: "Código enviado a ",
    buttons: {
      continue: "Continuar",
      verifyOtp: "Verificar OTP",
      submitCode: "Entrar",
      sending: "Enviando",
      verifying: "Verificando…",
    },
    cooldown: {
      retry: "Reenviar disponible en {seconds} segundos.",
      checking: "Comprobando disponibilidad…",
    },
    links: {
      alreadyHaveCode: "¿Ya tienes un código?",
      businessPrompt: "¿Eres empresa?",
      businessLink: "Crear cuenta empresarial",
      adminPrompt: "¿Administrador?",
      adminLink: "Acceso administrativo",
      notYourEmail: "¿No es tu correo?",
      changeEmail: "Cambiar correo",
    },
    toast: {
      otpSent:
        "Revisa tu correo: abre el enlace para entrar o usa el código de verificación.",
      signedIn: "Sesión iniciada",
    },
    errors: {
      default:
        "No se pudo iniciar sesión. Solicita un nuevo enlace o código desde tu email.",
    },
  },
  language: {
    spanish: "Español",
    english: "Inglés",
  },
  header: {
    searchLabel: "Buscar productos",
    searchPlaceholder: "Buscar cámaras, kits, marcas...",
    openMenu: "Abrir menú principal",
    closeMenu: "Cerrar menú principal",
    menuTitle: "Menú",
    mobileMenuLabel: "Menú principal móvil",
    nav: {
      home: "Inicio",
      categories: "Categorías",
      securitySystems: "Sistemas de Seguridad",
      brands: "Ver Marcas",
      services: "Servicios",
      contact: "Contacto",
      cart: "Carrito",
    },
  },
  admin: {
    categories: {
      title: "Categorías",
      description:
        "Define categorías de producto reutilizables. Las subcategorías se asocian a cada categoría al clasificar productos. El estado activo permite ocultarlas en la tienda y en la asignación de productos sin perder el historial.",
      filters: {
        status: {
          all: "Todos los estados",
          active: "Activas",
          inactive: "Inactivas",
        },
        clear: "Limpiar filtros",
        searchPlaceholder: "Buscar por nombre…",
      },
      table: {
        name: "Nombre",
        status: "Estado",
        updatedAt: "Última actualización",
        actions: "Acciones",
        statusActive: "Activa",
        statusInactive: "Inactiva",
        updatedTooltip: "Última actualización",
      },
      buttonNew: "Nueva",
      confirm: {
        archiveTitle: "¿Archivar categoría?",
        archiveMessage:
          "Se marcará como inactiva <strong>{name}</strong>. Podrás reactivarla editándola más adelante.",
        archiveConfirm: "Archivar",
      },
      form: {
        titleNew: "Nueva categoría",
        titleEdit: "Editar categoría",
        description:
          "Nombre único entre categorías activas. Si está inactiva, no se ofrece al clasificar productos.",
        labelName: "Nombre",
        labelNameEn: "Nombre en inglés",
        activeLabel: "Activa",
        activeDescription:
          "Si está desactivada, no se muestra al asignar categorías a productos.",
        cancel: "Cancelar",
        save: "Guardar",
      },
      toast: {
        created: "Categoría creada",
        updated: "Categoría actualizada",
        archived: "Categoría archivada",
        error: "No se pudo completar la operación",
      },
    },
  },
} as const;
