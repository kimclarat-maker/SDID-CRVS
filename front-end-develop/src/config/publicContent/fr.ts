import { DeepPartial } from "@/types/DeepPartial";
import { PublicContent } from "@/types/PublicContent";
import { platformConfig } from "@/config/platform.config";

/**
 * Partial French content. Public pages merge this over the English
 * dictionary, so any key not yet translated falls back to English
 * instead of breaking the page.
 */
export const fr: DeepPartial<PublicContent> = {
  common: {
    nav: {
      home: "Accueil",
      digitalIdentity: "Identité numérique",
      civilRegistration: "État civil",
      certificates: "Certificats",
      track: "Suivre une demande",
      verify: "Vérifier un document",
      serviceCentres: "Centres de service",
      help: "Aide",
      staffSignIn: "Connexion du personnel",
      skipToContent: "Aller au contenu principal",
      menu: "Menu",
    },
    common: {
      learnMore: "En savoir plus",
      getStarted: "Commencer",
      startNow: "Commencer maintenant",
      readMore: "Lire la suite",
      backToHome: "Retour à l'accueil",
      languageSelectorLabel: "Choisir la langue",
    },
  },
  home: {
    hero: {
      title:
        "Une plateforme de confiance pour l'état civil et l'identité numérique.",
      subtitle: `Enregistrez des événements de vie, demandez des certificats et gérez votre identité numérique — avec ${platformConfig.authorities.platformAuthority}.`,
      primaryCtaLabel: "Démarrer la pré-inscription à l'identité numérique",
      secondaryCtaLabel: "Découvrir l'état civil",
    },
    heroSlides: [
      {
        video: "/videos/crvs.mp4",
        title: "Chaque événement de vie, officiellement enregistré",
        subtitle:
          "Enregistrez les naissances, décès et mariages, et demandez des certificats sur une plateforme d'état civil de confiance.",
        ctaLabel: "Découvrir l'état civil",
        ctaHref: "/civil-registration",
      },
      {
        video: "/videos/sdid.mp4",
        title: "Une identité sécurisée, pour tous les services",
        subtitle: `Pré-inscrivez-vous à votre identité numérique et accédez aux services publics en toute confiance, avec ${platformConfig.authorities.platformAuthority}.`,
        ctaLabel: "Démarrer la pré-inscription à l'identité numérique",
        ctaHref: "/digital-identity",
      },
    ],
    about: {
      eyebrow: "À propos",
      index: "01",
      heading:
        "Une plateforme unique et fiable qui aide les citoyens à enregistrer les événements de vie, sécuriser une identité numérique et accéder aux services publics en toute confiance.",
      stats: [
        {
          value: "2",
          label: "Services essentiels",
          description:
            "Identité numérique et état civil, réunis sur une seule plateforme.",
        },
        {
          value: "8",
          label: "Services en ligne",
          description:
            "Les demandes d'identité et d'état civil les plus courantes, disponibles en ligne.",
        },
        {
          value: "24/7",
          label: "Accès",
          description:
            "Démarrez la plupart des services en ligne à tout moment, avec un accompagnement dans les centres de service.",
        },
      ],
    },
    serviceShowcase: {
      eyebrow: "Nos services",
      index: "02",
      heading: "Trouvez le service adapté à votre besoin",
      viewAllLabel: "Voir tous les services",
      viewAllHref: "#popular-services",
      tags: [
        "Identité numérique",
        "Enregistrement de naissance",
        "Enregistrement de décès",
        "Enregistrement de mariage",
        "Certificats",
        "Corrections",
      ],
      moreTagsLabel: "+2 de plus",
      items: [
        {
          title: "Identité numérique",
          description:
            "Pré-inscrivez-vous à une identité numérique, gérez votre profil et prenez rendez-vous pour l'enrôlement biométrique.",
          href: "/digital-identity",
        },
        {
          title: "État civil",
          description:
            "Enregistrez les naissances, décès et mariages, demandez des certificats et corrigez les actes d'état civil.",
          href: "/civil-registration",
        },
        {
          title: "Certificats",
          description:
            "Demandez un certificat officiel pour une naissance, un décès, un mariage ou un autre acte enregistré.",
          href: "/certificates",
        },
      ],
    },
  },
};

export default fr;
