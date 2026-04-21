export const en = {
  login: {
    heading: {
      title: "Sign in",
      description: "Access with your email address.",
    },
    emailLabel: "Email",
    codeLabel: "Verification code",
    codeSentPrefix: "Code sent to ",
    buttons: {
      continue: "Continue",
      verifyOtp: "Verify OTP",
      submitCode: "Enter",
      sending: "Sending",
      verifying: "Verifying…",
    },
    cooldown: {
      retry: "Resend available in {seconds} seconds.",
      checking: "Checking availability…",
    },
    links: {
      alreadyHaveCode: "Already have a code?",
      businessPrompt: "Business account?",
      businessLink: "Create business account",
      adminPrompt: "Administrator?",
      adminLink: "Admin access",
      notYourEmail: "Not your email?",
      changeEmail: "Change email",
    },
    toast: {
      otpSent: "Check your email for the link or verification code.",
      signedIn: "Signed in successfully.",
    },
    errors: {
      default: "Sign-in failed. Request a new link or code via your email.",
    },
  },
  language: {
    spanish: "Español",
    english: "English",
  },
  header: {
    searchLabel: "Search products",
    searchPlaceholder: "Search cameras, kits, brands...",
    openMenu: "Open main menu",
    closeMenu: "Close main menu",
    menuTitle: "Menu",
    mobileMenuLabel: "Main mobile menu",
    nav: {
      home: "Home",
      categories: "Categories",
      securitySystems: "Security Systems",
      brands: "See Brands",
      services: "Services",
      contact: "Contact",
      cart: "Cart",
    },
  },
  admin: {
    categories: {
      title: "Categories",
      description:
        "Define reusable product categories. Subcategories attach to each category when classifying products. The active state hides them from the storefront without losing the assignment history.",
      filters: {
        status: {
          all: "All statuses",
          active: "Active",
          inactive: "Inactive",
        },
        clear: "Clear filters",
        searchPlaceholder: "Search by name…",
      },
      table: {
        name: "Name",
        status: "Status",
        updatedAt: "Last updated",
        actions: "Actions",
        statusActive: "Active",
        statusInactive: "Inactive",
        updatedTooltip: "Last updated",
      },
      buttonNew: "New",
      confirm: {
        archiveTitle: "Archive category?",
        archiveMessage:
          "This will mark <strong>{name}</strong> as inactive. You can make it active again later.",
        archiveConfirm: "Archive",
      },
      form: {
        titleNew: "New category",
        titleEdit: "Edit category",
        description:
          "Unique name across active categories. Inactive ones are hidden when assigning categories to products.",
        labelName: "Name",
        labelNameEn: "Name (English)",
        activeLabel: "Active",
        activeDescription:
          "When disabled, it's not shown while assigning categories to products.",
        cancel: "Cancel",
        save: "Save",
      },
      toast: {
        created: "Category created",
        updated: "Category updated",
        archived: "Category archived",
        error: "Unable to complete the request",
      },
    },
  },
} as const;
