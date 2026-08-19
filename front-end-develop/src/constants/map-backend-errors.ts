export const mapBackendErrors: any = {
  english: {
    "OTP sent successfully, please check your phone for the code.":
      "OTP sent successfully, please check your phone for the code.",
    "Selfie verification skip code sent successfully.":
      "Selfie verification skip code sent successfully.",
    "File uploaded successfully": "File uploaded successfully",
    "OTP is not expired yet.": "OTP is not expired yet.",
    "Verification code sent successfully":
      "Verification code sent successfully",
    "Invalid verification code": "Invalid verification code",
    "Consent verified successfully": "Consent verified successfully",
    "Data not found": "Data not found",
    "Selfie does not match": "Selfie does not match",
    "Phone number is required for skip selfie verification":
      "Phone number is required for skip selfie verification",
    "Review started successfully": "Review started successfully",
    // Configuration Errors
    "Application environment not configured":
      "Application environment not configured",
    "API endpoint not configured": "API endpoint not configured",

    // Network Errors
    "No internet connection. Please check your network.":
      "No internet connection. Please check your network.",
    "Network request setup failed": "Network request setup failed",
    "Network error. Please check your connection.":
      "Network error. Please check your connection.",
    "Request timeout. Please try again.": "Request timeout. Please try again.",

    // Authentication Errors
    "Session expired. Please login again.":
      "Session expired. Please login again.",
    "Invalid session. Please login again.":
      "Invalid session. Please login again.",
    "Token refresh failed": "Token refresh failed",
    "Invalid token": "Invalid token",

    // HTTP Status Errors
    "Bad request": "Bad request",
    "You don't have permission for this action":
      "You don't have permission for this action",
    "Resource not found": "Resource not found",
    "Too many requests. Please try again later.":
      "Too many requests. Please try again later.",
    "Server error. Please try again later.":
      "Server error. Please try again later.",
    "Service unavailable. Please try again later.":
      "Service unavailable. Please try again later.",
    "An error occurred": "An error occurred",
    "The OTP is still valid and has not expired":
      "The OTP is still valid and has not expired",

    "Dependent identifier cannot be the same as legal guardian identifier":
      "Dependent identifier cannot be the same as legal guardian identifier",
    "This document type is not configured.":
      "This document type is not configured.",
    "Phone number not found": "Phone number not found",
    "Children info not found": "Children info not found",
    "The guardian's identifier is not registered in the CRVS system":
      "The guardian's identifier is not registered in the CRVS system",
    "Age is more than 18 years": "Age is more than 18 years",
    "There are no security questions linked to the selected document":
      "There are no security questions linked to the selected document",
    "There are no security questions linked to this request":
      "There are no security questions linked to this request",
    "You cannot book an appointment on this date. Please choose another date and try again":
      "You cannot book an appointment on this date. Please choose another date and try again",
    "The time you selected does not work for this center. Please check the details and try again":
      "The time you selected does not work for this center. Please check the details and try again",
    "The selected center is at the maximum capacity for the day. Please select another day and try again":
      "The selected center is at the maximum capacity for the day. Please select another day and try again",
    "The selected time slot is already full for today. Please choose another time slot or a different day and try again":
      "The selected time slot is already full for today. Please choose another time slot or a different day and try again",
    "The new appointment time should be 48 hours after the old appointment time.":
      "The new appointment time should be 48 hours after the old appointment time.",
    "The appointment cannot be rescheduled within 48 hours of the appointment time.":
      "The appointment cannot be rescheduled within 48 hours of the appointment time.",
    "Appointment date should be within 30 days from the date of booking.":
      "Appointment date should be within 30 days from the date of booking.",
    "Appointment date cannot be in the past.":
      "Appointment date cannot be in the past.",
    "An open appointment already exists for this request.":
      "An open appointment already exists for this request.",
    "Phone number is mandatory.": "Phone number is mandatory.",
    "Your skip face verification request has been reviewed.":
      "Your skip face verification request has been reviewed.",
    "You've been asked to visit the center for face verification.":
      "You've been asked to visit the center for face verification.",
    "Your skip face verification request has been rejected.":
      "Your skip face verification request has been rejected.",
    "The pre-enrollment request has been marked as rejected.'":
      "The pre-enrollment request has been marked as rejected.'",
    "Temp id is invalid'": "Temp id is invalid'",
    "Date of birth is invalid'": "Date of birth is invalid'",
    "For adult, age should be more than 18 years'":
      "For adult, age should be more than 18 years'",
    "For child, age should be less than or equal to 18 years":
      "For child, age should be less than or equal to 18 years",
    "Marital status for a child can only be single":
      "Marital status for a child can only be single",
    "A child cannot have a spouse name": "A child cannot have a spouse name",
    "Supporting document does not exist": "Supporting document does not exist",
    "The provided referral id number is invalid":
      "The provided referral id number is invalid",
    "Father id and mother id cannot be the same":
      "Father id and mother id cannot be the same",
    "Spouse nid cannot be same as that of a parent":
      "Spouse nid cannot be same as that of a parent",
    "Referral nid cannot be same as that of a parent":
      "Referral nid cannot be same as that of a parent",
    "Referral nid cannot be same as spouse nid":
      "Referral nid cannot be same as spouse nid",
    "Identifier cannot be same as that of a parent":
      "Identifier cannot be same as that of a parent",
    "Identifier cannot be same as spouse nid":
      "Identifier cannot be same as spouse nid",
    "Identifier cannot be same as referral id":
      "Identifier cannot be same as referral id",
    "The provided father id number is invalid":
      "The provided father id number is invalid",
    "The provided spouse id number is invalid":
      "The provided spouse id number is invalid",
    "A female id has been provided for father id number":
      "A female id has been provided for father id number",
    "Father age should be more than applicant age":
      "Father age should be more than applicant age",
    "Mother age should be more than applicant age":
      "Mother age should be more than applicant age",
    "The provided mother id number is invalid":
      "The provided mother id number is invalid",
    "A male id has been provided for mother id number":
      "A male id has been provided for mother id number",
    "Spouse id is required if marital status is not single":
      "Spouse id is required if marital status is not single",
    "A single person cannot have a spouse id":
      "A single person cannot have a spouse id",
    "RwandanNationality cannot be marriage, if marital status is single":
      "RwandanNationality cannot be marriage, if marital status is single",
    "Child has no parent information'": "Child has no parent information'",
    "Request already exists'": "Request already exists'",
    "The selected reviewer is not eligible to review the type of document present in the request.'":
      "The selected reviewer is not eligible to review the type of document present in the request.'",
    "Invalid country code'": "Invalid country code'",
    "Invalid province code'": "Invalid province code'",
    "Invalid district code'": "Invalid district code'",
    "Invalid sector code": "Invalid sector code",
    "Invalid cell code'": "Invalid cell code'",
    "Invalid village code'": "Invalid village code'",
    "Request already exists using different document type. Please use the same document type to resume request.":
      "Request already exists using different document type. Please use the same document type to resume request.",
    "Request already exists": "Request already exists",
    "Pre enrollment number already generated for this request":
      "Pre enrollment number already generated for this request",
    requestWithPendingReview: "Request already exists with pending review",
    "Your request has been rejected, please visit the nearest center for more information":
      "Your request has been rejected, please visit the nearest center for more information",
    "Request not found": "Request not found",
    "No family tree is available for this identifier":
      "No family tree is available for this identifier",
    "You can not create account with this role.'":
      "You can not create account with this role.'",
    "Email already in use": "Email already in use",
    "The provided id number is invalid": "The provided id number is invalid",
    "Account already exist with this identifier":
      "Account already exist with this identifier",
    "No db found for selected document type":
      "No db found for selected document type",
    "No info found for prehistorical info":
      "No info found for prehistorical info",
    "The provided id number is invalid or the person is deceased":
      "The provided id number is invalid or the person is deceased",
    "Identifier is invalid or applicant type not found, Please contact support team for assistance.":
      "Identifier is invalid or applicant type not found, Please contact support team for assistance.",
    "Category is not matching, Please contact support team for assistance.":
      "Category is not matching, Please contact support team for assistance.",
    "Out of bounds'": "Out of bounds'",
    "Invalid date range": "Invalid date range",
    "LG Request not found": "LG Request not found",

    "Logs not found": "Logs not found",

    "Alert not found": "Alert not found",
    "Out of bounds": "Out of bounds",
    "SMS Template not found": "SMS Template not found",
    "SMS template not found": "SMS template not found",
    "SMS setting not found": "SMS setting not found",
    "No active SMS setting found": "No active SMS setting found",
    "Notification not found": "Notification not found",
    "Notification configuration not found":
      "Notification configuration not found",
    "Security question not found": "Security question not found",
    "Schedule time slot not found": "Schedule time slot not found",
    "Timeslots not found": "Timeslots not found",
    "Roles not found": "Roles not found",
    "Role not found": "Role not found",
    "You are not allowed to delete this role":
      "You are not allowed to delete this role",
    "Role value already exists": "Role value already exists",
    "This role has been assigned to a menu":
      "This role has been assigned to a menu",
    "No data found": "No data found",
    "Menu not found": "Menu not found",
    "Email Template not found": "Email Template not found",
    "Email template not found": "Email template not found",
    "No active Email setting not found": "No active Email setting not found",
    "Document Type not found": "Document Type not found",
    "Applicant Category not found": "Applicant Category not found",
    "Account not found": "Account not found",
    "The supporting document does not exist":
      "The supporting document does not exist",
    "The password has been used recently":
      "The password has been used recently",
    "Account/Password is incorrect": "Account/Password is incorrect",
    "Account does not exist": "Account does not exist",
    "The current password is incorrect": "The current password is incorrect",
    "The session does not exist": "The session does not exist",
    "Photo does not exist/login not started":
      "Photo does not exist/login not started",
    "Photo does not match": "Photo does not match",
    "Invalid Email": "Invalid Email",
    "Identifier not found": "Identifier not found",
    "Legal guardian not found": "Legal guardian not found",
    "This document type is not available for {category}.":
      "This document type is not available for {category}.",
    "The identifier should start with {prefix}.":
      "The identifier should start with {prefix}.",
    "Legal guardian selfie not verified": "Legal guardian selfie not verified",
    "The legal guardian is less than 18 years old.":
      "The legal guardian is less than 18 years old.",
    "Legal guardian and dependent cannot be the same person'":
      "Legal guardian and dependent cannot be the same person'",
    "Supporting documents not exist": "Supporting documents not exist",
    "The selfie is missing": "The selfie is missing",
    "Supporting ID proof is missing": "Supporting ID proof is missing",
    "Masked phone number not found": "Masked phone number not found",
    "The selfie is not verified": "The selfie is not verified",
    "Child not found in parent's data": "Child not found in parent's data",
    "A request already exists with the same name and parent ID number":
      "A request already exists with the same name and parent ID number",
    "A phone number is required to skip selfie verification":
      "A phone number is required to skip selfie verification",
    "Citizen photo is not available; provide phone number to skip selfie verification":
      "Citizen photo is not available; provide phone number to skip selfie verification",
    "Access Right not found": "Access Right not found",
    "Access Right detail not found": "Access Right detail not found",
    "Access Right not found for this module.":
      "Access Right not found for this module.",
    "Villages not found": "Villages not found",
    "Village not found": "Village not found",
    "Province not found": "Province not found",
    "District not found": "District not found",
    "Sectors not found": "Sectors not found",
    "Sector not found": "Sector not found",
    "The sector is not a part of the district":
      "The sector is not a part of the district",
    "The cell is not a part of the sector":
      "The cell is not a part of the sector",
    "The district is not a part of the province":
      "The district is not a part of the province",
    "Country not found": "Country not found",
    "Province already exists": "Province already exists",
    "This province has been assigned to a district.":
      "This province has been assigned to a district.",
    "This province has been assigned to a sector.":
      "This province has been assigned to a sector.",
    "This province has been assigned to a cell.":
      "This province has been assigned to a cell.",
    "This province has been assigned to a village.":
      "This province has been assigned to a village.",
    "This province has been assigned to a center.":
      "This province has been assigned to a center.",
    "The village is not a part of the cell":
      "The village is not a part of the cell",
    "Invalid citizenship": "Invalid citizenship",
    "Citizenship is not {citizenship}": "Citizenship is not {citizenship}",
    "You have already requested a code that has not yet expire":
      "You have already requested a code that has not yet expire",
    "Reviewer cannot start review for his / her own request":
      "Reviewer cannot start review for his / her own request",
    "Reviewer cannot start review for a request, he / she is the digital ambassador of":
      "Reviewer cannot start review for a request, he / she is the digital ambassador of",
    "Reviewer cannot start review for a request, he / she is the father / mother / spouse of the applicant":
      "Reviewer cannot start review for a request, he / she is the father / mother / spouse of the applicant",
    "Reviewer cannot start review for a request, he / she is the legal guardian of the applicant":
      "Reviewer cannot start review for a request, he / she is the legal guardian of the applicant",
  },

  french: {
    "OTP sent successfully, please check your phone for the code.":
      "OTP envoyé avec succès, veuillez vérifier votre téléphone pour le code.",
    "Selfie verification skip code sent successfully.":
      "Code de saut de vérification par selfie envoyé avec succès.",
    "File uploaded successfully": "Fichier téléchargé avec succès.",
    "OTP is not expired yet.": "L'OTP n'a pas encore expiré.",
    "Verification code sent successfully":
      "Code de vérification envoyé avec succès",
    "Consent verified successfully": "Consentement vérifié avec succès",
    "Data not found": "Données non trouvées",
    "Selfie does not match": "La selfie ne correspond pas",
    "Phone number is required for skip selfie verification":
      "Un numéro de téléphone est requis pour sauter la vérification par selfie",
    "Review started successfully": "Examen démarré avec succès",
    // Configuration Errors
    "Application environment not configured":
      "Environnement d'application non configuré",
    "API endpoint not configured": "Point de terminaison API non configuré",

    // Network Errors
    "No internet connection. Please check your network.":
      "Pas de connexion Internet. Veuillez vérifier votre réseau.",
    "Network request setup failed":
      "Échec de la configuration de la requête réseau",
    "Network error. Please check your connection.":
      "Erreur réseau. Veuillez vérifier votre connexion.",
    "Request timeout. Please try again.":
      "Délai d'attente dépassé. Veuillez réessayer.",

    // Authentication Errors
    "Session expired. Please login again.":
      "Session expirée. Veuillez vous reconnecter.",
    "Invalid session. Please login again.":
      "Session invalide. Veuillez vous reconnecter.",
    "Token refresh failed": "Échec du rafraîchissement du jeton",
    "Invalid token": "Jeton invalide",

    // HTTP Status Errors
    "Bad request": "Requête incorrecte",
    "You don't have permission for this action":
      "Vous n'avez pas la permission pour cette action",
    "Resource not found": "Ressource non trouvée",
    "Too many requests. Please try again later.":
      "Trop de requêtes. Veuillez réessayer plus tard.",
    "Server error. Please try again later.":
      "Erreur serveur. Veuillez réessayer plus tard.",
    "Service unavailable. Please try again later.":
      "Service indisponible. Veuillez réessayer plus tard.",
    "An error occurred": "Une erreur est survenue",

    "The OTP is still valid and has not expired":
      "Le code OTP est toujours valide et n’a pas expiré",

    "Dependent identifier cannot be the same as legal guardian identifier":
      "L’identifiant du bénéficiaire ne peut pas être le même que celui du tuteur légal.",
    "This document type is not configured.":
      "Ce type de document n’est pas encore configuré",
    "Phone number not found": "Le numéro de téléphone n’a pas été trouvé",
    "Children info not found":
      "Les informations concernant les enfants n’ont pas été trouvées",
    "The guardian's identifier is not registered in the CRVS system":
      "L’identifiant du représentant légal n’est pas inscrit dans le système CRVS",
    "Age is more than 18 years": "L’âge est supérieur à 18 ans",
    "There are no security questions linked to the selected document":
      "Le document sélectionné n’a pas de questions de sécurité associées",
    "There are no security questions linked to this request":
      "Aucune question de sécurité trouvée pour cette demande",
    "You cannot book an appointment on this date. Please choose another date and try again":
      "Il n’est pas possible de prendre un rendez-vous à cette date. Veuillez choisir une autre date et réessayer.",
    "The time you selected does not work for this center. Please check the details and try again":
      "Il n’est pas possible de prendre un rendez-vous à cette date. Veuillez choisir une autre date et réessayer",
    "The selected center is at the maximum capacity for the day. Please select another day and try again":
      "Le centre sélectionné est à sa capacité maximale pour la journée. Veuillez sélectionner un autre jour et réessayer.",
    "The selected time slot is already full for today. Please choose another time slot or a different day and try again":
      "Le créneau horaire sélectionné est à sa capacité maximale pour la journée. Veuillez sélectionner un autre créneau horaire ou un autre jour et réessayer.",
    "The new appointment time should be 48 hours after the old appointment time.":
      "La nouvelle heure de rendez-vous doit être 48 heures après l'ancienne heure de rendez-vous",
    "The appointment cannot be rescheduled within 48 hours of the appointment time.":
      "Le rendez-vous ne peut pas être reporté dans les 48 heures suivant l'heure prévue.",
    "Appointment date should be within 30 days from the date of booking.":
      "La date du rendez-vous doit être dans les 30 jours suivant la date de réservation.",
    "Appointment date cannot be in the past.":
      "La date du rendez-vous ne peut pas être antérieure.",
    "An open appointment already exists for this request.":
      "Un rendez-vous est déjà disponible pour cette demande.",
    "Phone number is mandatory.": "Le numéro de téléphone est obligatoire.",
    "Your skip face verification request has been reviewed.":
      "Votre demande de vérification faciale a été examinée.",
    "You've been asked to visit the center for face verification.":
      "Vous avez été invité à vous rendre au centre pour une vérification faciale.",
    "Your skip face verification request has been rejected.":
      "Votre demande de vérification faciale a été rejetée.",
    "The pre-enrollment request has been marked as rejected.":
      "La demande de préinscription a été marquée comme rejetée.",
    "Temp id is invalid": "Identifiant temporaire non valide",
    "Date of birth is invalid": "Date de naissance non valide",
    "For adult, age should be more than 18 years":
      "Pour un adulte, l'âge doit être supérieur à 18 ans",
    "For child, age should be less than or equal to 18 years":
      "Pour un enfant, l'âge doit être inférieur ou égal à 18 ans",
    "Marital status for a child can only be single":
      "L'état civil d'un enfant ne peut être que célibataire",
    "A child cannot have a spouse name":
      "Un enfant ne peut pas avoir de nom de conjoint",
    "Supporting document does not exist": "Pièce justificative inexistante",
    "The provided referral id number is invalid":
      "Le numéro d'identification de référence fourni est invalide",
    "Father id and mother id cannot be the same":
      "Les identifiants du père et de la mère ne peuvent pas être identiques",
    "Spouse nid cannot be same as that of a parent":
      "Le numéro d'identification du conjoint ne peut pas être identique à celui d'un parent",
    "Referral nid cannot be same as that of a parent":
      "Le numéro d'identification de référence ne peut pas être identique à celui d'un parent",
    "Referral nid cannot be same as spouse nid":
      "Le numéro d'identification de référence ne peut pas être identique au numéro d'identification du conjoint",
    "Identifier cannot be same as that of a parent":
      "L'identifiant ne peut pas être identique à celui d'un parent",
    "Identifier cannot be same as spouse nid":
      "L'identifiant ne peut pas être identique au numéro d'identification du conjoint",
    "Identifier cannot be same as referral id":
      "L'identifiant ne peut pas être identique à l'identifiant de référence.",
    "The provided father id number is invalid":
      "Le numéro d'identification du père fourni est invalide.",
    "The provided spouse id number is invalid":
      "Le numéro d'identification du conjoint fourni est invalide.",
    "A female id has been provided for father id number":
      "Un identifiant féminin a été fourni pour le numéro d'identification du père.",
    "Father age should be more than applicant age":
      "L'âge du père doit être supérieur à celui du demandeur.",
    "Mother age should be more than applicant age":
      "L'âge de la mère doit être supérieur à celui du demandeur.",
    "The provided mother id number is invalid":
      "Le numéro d'identification de la mère fourni est invalide.",
    "A male id has been provided for mother id number":
      "Un identifiant masculin a été fourni pour le numéro d'identification de la mère.",
    "Spouse id is required if marital status is not single":
      "L'identifiant du conjoint est requis si l'état civil n'est pas célibataire.",
    "A single person cannot have a spouse id":
      "Une personne célibataire ne peut pas avoir d'identifiant de conjoint.",
    "RwandanNationality cannot be marriage, if marital status is single":
      "La nationalité rwandaise ne peut pas être le mariage si l'état civil est célibataire.",
    "Child has no parent information":
      "L'enfant n'a aucune information parentale.",
    "Request already exists": "La demande existe déjà.",
    "The selected reviewer is not eligible to review the type of document present in the request.":
      "L'examinateur sélectionné n'est pas autorisé à examiner le type de document présent dans la demande.",
    "Invalid country code": "Code pays invalide.",
    "Invalid province code": "Code province invalide.",
    "Invalid district code": "Code district invalide.",
    "Invalid sector code": "Code secteur invalide.",
    "Invalid cell code": "Code cellulaire invalide.",
    "Invalid village code": "Code village invalide.",
    "Request already exists using different document type. Please use the same document type to resume request.":
      "La demande existe déjà avec un type de document différent. Veuillez utiliser le même type de document pour reprendre la demande.",
    "Pre enrollment number already generated for this request":
      "Numéro de préinscription déjà généré pour cette demande",
    "Request already exists with pending review":
      "Demande déjà existante avec examen en attente",
    "Your request has been rejected, please visit the nearest center for more information":
      "Votre demande a été rejetée. Veuillez vous rendre au centre le plus proche pour plus d'informations.",
    "No family tree is available for this identifier":
      "Aucun arbre généalogique n'est disponible pour cet identifiant.",
    "You can not create account with this role.":
      "Vous ne pouvez pas créer de compte avec ce rôle.",
    "Email already in use": "Adresse e-mail déjà utilisée",
    "Account already exist with this identifier":
      "Un compte existe déjà avec cet identifiant",
    "No db found for selected document type":
      "Aucune base de données trouvée pour le type de document sélectionné",
    "No info found for prehistorical info":
      "Aucune information trouvée pour les informations préhistoriques",
    "The provided id number is invalid or the person is deceased":
      "Le numéro d'identification fourni est invalide ou la personne est décédée",
    "Identifier is invalid or applicant type not found, Please contact support team for assistance.":
      "L'identifiant est invalide ou le type de demandeur est introuvable. Veuillez contacter l'équipe d'assistance pour obtenir de l'aide.",
    "Category is not matching, Please contact support team for assistance.":
      "La catégorie ne correspond pas. Veuillez contacter l'équipe d'assistance pour obtenir de l'aide.",
    "Out of bounds": "Hors limites",
    "Invalid date range": "Plage de dates invalide",
    "LG Request not found": "Demande LG introuvable",
    "Request not found": "Demande introuvable",
    "Logs not found": "Journaux introuvables",
    "Alert not found": "Alerte introuvable",
    "SMS Template not found": "Modèle de SMS introuvable",
    "SMS setting not found": "Paramètre SMS introuvable",
    "No active SMS setting found": "Aucun paramètre SMS actif n'a été trouvé",
    "Notification not found": "Notification introuvable",
    "Notification configuration not found":
      "Configuration de notification introuvable",
    "Security question not found": "Question de sécurité introuvable",
    "Schedule time slot not found": "Créneau horaire introuvable",
    "Timeslots not found": "Créneaux horaires introuvables",
    "Roles not found": "Rôles introuvables",
    "Role not found": "Rôle introuvable",
    "You are not allowed to delete this role":
      "Vous n'êtes pas autorisé à supprimer ce rôle.",
    "Role value already exists": "La valeur du rôle existe déjà.",
    "This role has been assigned to a menu":
      "Ce rôle a été attribué à un menu.",
    "No data found": "Aucune donnée trouvée.",
    "Menu not found": "Menu introuvable",
    "Email Template not found": "Modèle d'e-mail introuvable",
    "No active Email setting not found":
      "Aucun paramètre d'e-mail actif n'a été trouvé",
    "Document Type not found": "Type de document introuvable",
    "Applicant Category not found": "Catégorie de candidat non trouvée",
    "Account not found": "Compte introuvable",
    "The supporting document does not exist": "Le justificatif n'existe pas",
    "The password has been used recently":
      "Le mot de passe a été utilisé récemment.",
    "Account/Password is incorrect": "Compte/Mot de passe incorrect.",
    "Account does not exist": "Le compte n'existe pas.",
    "The current password is incorrect":
      "Le mot de passe actuel est incorrect.",
    "The session does not exist": "La session n'existe pas.",
    "Photo does not exist/login not started":
      "La photo n'existe pas/Connexion non démarrée.",
    "Photo does not match": "La photo ne correspond pas.",
    "Invalid Email": "E-mail invalide.",
    "Identifier not found": "Identifiant introuvable",
    "Legal guardian not found": "Tuteur légal introuvable",
    "This document type is not available for {category}.":
      "Ce type de document n'est pas disponible pour {category}.",
    "The identifier should start with {prefix}.":
      "L'identifiant doit commencer par {prefix}.",
    "Legal guardian selfie not verified": "Selfie du tuteur légal non vérifié",
    "The legal guardian is less than 18 years old.":
      "Le tuteur légal a moins de 18 ans.",
    "Legal guardian and dependent cannot be the same person":
      "Le tuteur légal et la personne à charge ne peuvent pas être la même personne.",
    "Supporting documents not exist": "Justificatifs inexistants",
    "The selfie is missing": "Le selfie est manquant",
    "Supporting ID proof is missing": "Justificatif d'identité manquant",
    "Masked phone number not found": "Numéro de téléphone masqué introuvable",
    "The selfie is not verified": "Le selfie n'est pas vérifié",
    "Child not found in parent's data":
      "Enfant introuvable dans les données du parent",
    "A request already exists with the same name and parent ID number":
      "Une demande existe déjà avec le même nom et le même numéro d'identification du parent.",
    "A phone number is required to skip selfie verification":
      "Un numéro de téléphone est requis pour ignorer la vérification du selfie.",
    "Citizen photo is not available; provide phone number to skip selfie verification":
      "La photo du citoyen n'est pas disponible ; veuillez fournir un numéro de téléphone pour ignorer la vérification du selfie.",
    "Access Right not found": "Droit d'accès introuvable",
    "Access Right detail not found": "Détails du droit d'accès introuvables",
    "Access Right not found for this module.":
      "Droit d'accès introuvable pour ce module.",
    "Villages not found": "Villages non trouvés",
    "Village not found": "Village non trouvé",
    "Province not found": "Province non trouvée",
    "District not found": "District non trouvé",
    "Sectors not found": "Secteurs non trouvés",
    "Sector not found": "Secteur non trouvé",
    "The sector is not a part of the district":
      "Le secteur ne fait pas partie du district",
    "The cell is not a part of the sector":
      "La cellule ne fait pas partie du secteur",
    "The district is not a part of the province":
      "Le district ne fait pas partie de la province",
    "Country not found": "Pays non trouvé",
    "Province already exists": "La province existe déjà",
    "This province has been assigned to a district.":
      "Cette province a été attribuée à un district.",
    "This province has been assigned to a sector.":
      "Cette province a été assignée à un secteur.",
    "This province has been assigned to a cell.":
      "Cette province a été assignée à une cellule.",
    "This province has been assigned to a village.":
      "Cette province a été attribuée à un village.",
    "This province has been assigned to a center.":
      "Cette province a été attribuée à un centre.",
    "The village is not a part of the cell":
      "Le village ne fait pas partie de la cellule",
    "Invalid citizenship": "Citoyenneté invalide",
    "Citizenship is not {citizenship}":
      "La citoyenneté n'est pas la {citoyenneté}",
    "You have already requested a code that has not yet expire":
      "Vous avez déjà demandé un code qui n'a pas encore expiré. Veuillez réessayer après 5 minutes.",
    "Reviewer cannot start review for his / her own request":
      "Action interdite : vous ne pouvez pas réviser votre propre document",
    "Reviewer cannot start review for a request he/she is the digital ambassador of":
      "Le réviseur ne peut pas commencer l'examen d'une demande dont il/elle est l'ambassadeur digital.",
    "Reviewer cannot start review for a request he/she is the father/mother/spouse of the applicant":
      "Le réviseur ne peut pas commencer l'examen d'une demande pour laquelle il/elle est le père/la mère/le conjoint du demandeur.",
    "Reviewer cannot start review for a request he/she is the legal guardian of the applicant":
      "Le réviseur ne peut pas commencer l'examen d'une demande pour laquelle il/elle est le tuteur légal du demandeur.",
    "Some of the answers provided are not correct.":
      "Certaines des réponses fournies sont incorrectes.",
    "Security questions answered successfully":
      "Réponses aux questions de sécurité validées",
    "Request already exists with NHP_SELFIE_CAPTURE_PENDING status":
      "Une demande existe déjà avec le statut NHP_SELFIE_CAPTURE_PENDING",
    "Delete data successfully": "Supprimer les données avec succès",
  },
  kinyarwanda: {
    "OTP sent successfully, please check your phone for the code.":
      "OTP yoherejwe, reba kuri telefone yawe ukoreshe kode wohererejwe.",
    "Selfie verification skip code sent successfully.":
      "Kode yo gukomeza hatakoreshejwe ifoto yoherejwe, reba kuri telephone yawe ukoreshe code wohererejwe.",
    "File uploaded successfully": "Dosiye yabitswe neza.",
    "OTP is not expired yet.": "OTP kode ntirarangiye.",
    "Verification code sent successfully":
      "Kode yokwemeza gukoresha umwirondoro wavuguruwe yoherejwe neza",
    "Consent verified successfully":
      "Gutanga uburenganzira bwo gukomeza n'umwirondoro wavuguruwe byemejwe",
    "Data not found": "Ntamakuru abashije kuboneka",
    "Selfie does not match":
      "Ifoto wafashe ntago ihuye n'iyo iri mu bubiko bw'irangamuntu",
    "Phone number is required for skip selfie verification":
      "Numero ya telefoni irakeneye kugirango ukomeze hadafashwe ifoto (selfie)",
    "Review started successfully": "Gutangira kugenzura umwirondoro...",

    // Configuration Errors
    "Application environment not configured":
      "Aho porogaramu ikururira amakuru ntihateguwe neza",
    "API endpoint not configured": "Aho API iva ntihateguwe neza",

    // Network Errors
    "No internet connection. Please check your network.":
      "Nta interineti ihagije ufite. suzuma neza niba  ufite interineti",
    "Network request setup failed":
      "Gushyiraho gahunda yo gusesengura urusobe byanze",
    "Network error. Please check your connection.":
      "Ikosa mu musobe. Murakoze mugaragaze neza ihuza ryanyu.",
    "Request timeout. Please try again.":
      "Ubusabe bwarengeje igihe. Mwongere mugerageze mukanya",

    // Authentication Errors
    "Session expired. Please login again.":
      "Igihe cyawe cyarangiye. Ongera winjire nanone.",
    "Invalid session. Please login again.":
      "Igihe utanze ntabwo ari cyo. Murakoze winjire nanone.",
    "Token refresh failed": "Kuvugurura token ntago ntabwo byakunze",
    "Invalid token": "Token utanze ntabwo ari yo",

    // HTTP Status Errors
    "Bad request": "Ntago bishobotse gukubona amakuru wasebye",
    "You don't have permission for this action":
      "Ntabwo ufite uburenganzira bwo gukora iki gikorwa",
    "Resource not found": "Ntabwo ibyo usabye byabonetse",
    "Too many requests. Please try again later.":
      "Ibisabwa nibyinshi cyane. Mugerageze nyuma y'igihe.",
    "Server error. Please try again later.":
      "Seriveri ntishoboye kuboneka. Mwongere mugerageze mukanya.",
    "Service unavailable. Please try again later.":
      "Serivisi ntishoye kuboneka. Mwongere mugerageze mukanya.",
    "An error occurred": "Hari ikosa ribaye",

    "OTP is not expired yet": "Igihe cya OTP ntikirarangira.",

    "Dependent identifier cannot be the same as legal guardian identifier":
      "Indangamuntu y'usaba ntishobora kuba imwe n'iyu mubyeyi wemewe",
    "This document type is not configured.":
      "Ubwoko bw'inyandiko ntibubashije kuboneka",
    "Phone number not found": "Ntitwabashije kubona nimero ya telefone",
    "Children info not found": "Amakuru yerekeye umwana ntabashije kuboneka",
    "Guardian identifier not registered with CRVS":
      "Umwirondoro w'umurera ntiwagaragaye muri sisitemu ya CRVS",
    "Age is more than 18 years": "Ufite imyaka irenze 18",
    "No security questions found for selected document":
      "Inyandiko wahisemo nta bibazo by'umutekano bifitanye isano nayo",
    "No security questions found for the request":
      "Nta bibazo by'umutekano bifitanye isano n'ubu busabe",
    "An appointment is not possible for this date. Please select another date and try again":
      "Ntabwo ushobora kubona gahunda kuri iyi tariki.  hitamo indi tariki ugerageze bundi bushya.",
    "Selected timeslot is not applicable for this center. Please confirm the details and try again":
      "Ntabwo ushobora kubona gahunda kuri iyi tariki.  hitamo indi tariki ugerageze bundi bushya.",
    "The selected center is at the maximum capacity for the day. Please select another day and try again":
      "Ikigo wahisemo cyuzuye uyu munsi.  hitamo undi munsi wongere ugerageze.",
    "The selected timeslot is at the maximum capacity for the day. Please select another timeslot or another day and try again":
      "Isaha mwahisemo yamaze kuzura uyu munsi. Mwihitiremo indi saha cyangwa indi tariki, hanyuma musubiremo.",
    "The new appointment time should be 48 hours after the old appointment time.":
      "Igihe gishya cya rendez-vous kigomba kuba amasaha 48 nyuma y'igihe cya rendez-vous cya mbere.",
    "The appointment cannot be rescheduled within 48 hours of the appointment time.":
      "Gahunda ntishobora kwimurwa mugihe cyamasaha 48 uhereye igihe giteganijwe.",
    "Appointment date should be within 30 days from the date of booking.":
      "Itariki igomba kuba mugihe cyiminsi 30 uhereye umunsi watangiriyeho.",
    "Appointment date cannot be in the past.":
      "Itariki yo yokuzajya kwiyandikisha ntishobora gusabwa nyuma y'uyumunsi",
    "An open appointment already exists for this request.":
      "Usanzwe warahawe itariki yo kuzajya gufatirwa ibikumwe",
    "Phone number is mandatory.": "Numero ya terefone irakenewe.",
    "Your skip face verification request has been reviewed.":
      "Icyifuzo cyawe cyo gukomeza hadafashwe ifoto cyarasubijwe.",
    "You've been asked to visit the center for face verification.":
      "Watumiwe kuza kuri santere ikwegereye kugirango tugufashe kwiyandikisha.",
    "Your skip face verification request has been rejected.":
      "Icyifuzo cyawe cyo kugenzura cyarahakanwe.",
    "The pre-enrollment request has been marked as rejected.":
      "Icyifuzo cyo kwiyandikisha cyaranzwe.",
    "Temp id is invalid": "TEMP ID yigihe gito ntago ariyo",
    "Date of birth is invalid": "Itariki y'amavuko ntabwo ariyo",
    "For adult, age should be more than 18 years":
      "Ku muntu mukuru, imyaka igomba kuba irenga 18",
    "For child, age should be less than or equal to 18 years":
      "Ku mwana, imyaka igomba kuba 18 cyangwa munsi yayo",
    "Marital status for a child can only be single":
      "Irangamimerere y'umwana igomba kuba ingaragu gusa",
    "A child cannot have a spouse name":
      "Umwana ntashobora kugira izina ry'uwo bashakanye",
    "Supporting document does not exist": "Nta nyandiko ibashije kuboneka",
    "The provided referral id number is invalid":
      "Inomero y'irangamuntu yatanzwe ntabwo yemewe",
    "Father id and mother id cannot be the same":
      "Indangamuntu ya se na nyina ntishobora kuba imwe",
    "Spouse nid cannot be same as that of a parent":
      "Indangamuntu y'uwo mwashakanye ntishobora kuba imwe na nimero y'irangamuntu y'ababyeyi",
    "Referral nid cannot be same as that of a parent":
      "Inomero y'irangamuntu ntishobora kuba imwe na nimero y'irangamuntu y'ababyeyi",
    "Referral nid cannot be same as spouse nid":
      "Inomero y'irangamuntu ntishobora kuba imwe na nimero y'irangamuntu",
    "Identifier cannot be same as that of a parent":
      "Indangamuntu ntishobora kumera nkindangamuntu yababyeyi.",
    "Identifier cannot be same as spouse nid":
      "Indangamuntu ntishobora kuba imwe n'indangamuntu yuwo mwashakanye.",
    "Identifier cannot be same as referral id":
      "Indangamuntu ntishobora kumera nkirangamuntu.",
    "The provided father id number is invalid":
      "Indangamuntu ya se ntabwo yemewe.",
    "The provided spouse id number is invalid":
      "Indangamuntu y'uwo mwashakanye ntabwo yemewe.",
    "A female id has been provided for father id number":
      "Indangamuntu y'igitsina gore ntabwo yemewe.",
    "Father age should be more than applicant age":
      "Imyaka ya se igomba kuba myinshi kurenza uwasabye.",
    "Mother age should be more than applicant age":
      "Imyaka ya nyina igomba kuba myinshi kurenza uwasabye.",
    "The provided mother id number is invalid":
      "Indangamuntu ya nyina ntabwo yemewe.",
    "A male id has been provided for mother id number":
      "Indangamuntu y'umugabo yatanzwe ntabwo yemewe.",
    "Spouse id is required if marital status is not single":
      "Indangamuntu y'uwo mwashakanye irasabwa niba niba irangamimerere atari ingaragu.",
    "A single person cannot have a spouse id":
      "Umuntu w' ingaragu ntashobora kugira umufasha.",
    "RwandanNationality cannot be marriage, if marital status is single":
      "Ubwenegihugu bw'u Rwanda ntibushobora kuba  ishyingirwa niba irangamimerere ari ingaragu.",
    "Child has no parent information": "Umwana nta makuru y'ababyeyi afite.",
    "Request already exists": "Usanzwe wari yandikishije.",
    "The selected reviewer is not eligible to review the type of document present in the request.":
      "Ntabwo wemerewe gukora kuri iyi dosiye",
    "Invalid country code": "Kode y'igihugu ntiyemewe.",
    "Invalid province code": "Kode yintara ntiyemewe.",
    "Invalid district code": "Kode y'akarere ntiyemewe.",
    "Invalid sector code": "Kode y'umurenge ntiyemewe.",
    "Invalid cell code": "Kode y'umudugudu ntiyemewe.",
    "Invalid village code": "Kode y' akagari ntiyemewe.",
    "Request already exists using different document type. Please use the same document type to resume request.":
      "Dosiye yawe isanzwe irimo. Subukura gusaba kugirango ukomeze",
    "Pre enrollment number already generated for this request":
      "Dosiye yawe isanzwe irimo. wamaze guhabwa numero ya SDID Pre-Enrollment ",
    "Request already exists with pending review":
      "Dosiye yawe itegereje gukorwaho.",
    "Your request has been rejected, please visit the nearest center for more information":
      "Dosiye yawe yarahakanwe. Sura ikigo cyikwegereye kugirango uhabwe ibindi bisobanuro.",
    "Request not found": "Dosiye ntibashije kuboneka",
    "No family tree is available for this identifier":
      "Amakuru ku muryango ufite ntabashije kuboneka",
    "You can not create account with this role.": "Ntibishobotse kwiyandikisha",
    "Email already in use": "Imeri imeri isanzwe ikoreshwa",
    "The provided id number is invalid":
      "Inomero y'irangamuntu yatanzwe ntabwo ibashije kuboneka",
    "Account already exist with this identifier":
      "Konti isanzweho hamwe niyi ndangamuntu",
    "No db found for selected document type":
      "Nta makuru yabonetse kubwoko bwatoranijwe",
    "No info found for prehistorical info":
      "Nta makuru yabonetse kumakuru yarasanzwe afite",
    "The provided id number is invalid or the person is deceased":
      "Inomero y'irangamuntu yatanzwe nti yemewe umuntu yarapfuye",
    "Identifier is invalid or applicant type not found, Please contact support team for assistance.":
      "Indangamuntu ntiyemewe cyangwa icyicyiro cywasabye ntigushoboye kuboneka. Nyamuneka saba itsinda ryabafasha kugirango bagufashe.",
    "Category is not matching, Please contact support team for assistance.":
      "Icyiciro ntabwo gihuye. Nyamuneka saba itsinda ryabafasha kugirango bagufashe.",
    "Out of bounds": "Ntibikunzwe kubona amakuru kurioage usabye",
    "Invalid date range": "Itariki ntarengwa",
    "LG Request not found": "LG icyifuzo nticyabonetse",
    "Logs not found": "Amakuru logs ntabashije kuboneka",
    "Alert not found": "Amakuru ntabashije kuboneka",
    "SMS Template not found": "Inyandiko ya SMS ntabwo yabonetse",
    "SMS setting not found": "Igenamiterere rya SMS ntiriboneka",
    "No active SMS setting found": "Nta mikorere ya SMS ikora yabonetse",
    "Notification not found": "Imenyekanisha ntiriboneka",
    "Notification configuration not found":
      "Ibikoresho byo kumenyesha ntabwo byabonetse",
    "Security question not found": "Ikibazo cyumutekano nticyabonetse",
    "Schedule time slot not found": "Umwanya wigihe ntiwabonetse",
    "Timeslots not found": "Umwanya wigihe ntiwabonetse",
    "Roles not found": "Inshingano zitabonetse",
    "Role not found": "Uruhare ntirwabonetse",
    "You are not allowed to delete this role":
      "Ntabwo wemerewe gusiba iyi nshingano.",
    "Role value already exists": "Uruhare agaciro kamaze kubaho.",
    "This role has been assigned to a menu": "Uru ruhare rwahawe menu.",
    "No data found": "Nta makuru yabonetse.",
    "Menu not found": "Ibikubiyemo ntibyabonetse",
    "Email Template not found": "Inyandiko ya imeri ntabwo yabonetse",
    "No active Email setting not found":
      "Nta mikorere ya imeri ikora yabonetse",
    "Document Type not found": "Ubwoko bw'inyandiko ntibubonetse",
    "Applicant Category not found": "Icyiciro cy'abakandida nticyabonetse",
    "Account not found": "Konti ntabwo yabonetse",
    "Password has been used recently": "Ijambobanga ryakoreshejwe vuba aha.",
    "Account/Password is incorrect": "Konti / ijambo ryibanga ntabwo ariryo",
    "Account does not exist": "Konti ntabwo ibaho.",
    "Current Password is incorrect": "Ijambobanga ryubu ntabwo aribyo.",
    "Session does not exist": "Isomo ntiribaho.",
    "Photo does not exist/login not started":
      "Ifoto ntibaho / Kwinjira ntabwo byatangiye.",
    "Photo does not match": "Ifoto ntabwo ihuye.",
    "Invalid Email": "Imeri itemewe.",
    "Identifier not found": "Indangamuntu y'abakoresha ntabwo yabonetse",
    "Legal guardian not found": "Umuhagarariye ntabonetse",
    "This document type is not available for {category}.":
      "Ubwoko bwinyandiko ntabwo buboneka kuri {icyiciro}.",
    "Identifier should start with {prefix}.":
      "Umukoresha ID agomba gutangirana na {prefix}.",
    "Legal guardian selfie not verified":
      "Umuhagarariye ifoto yafashwe ntabwo yemejwe",
    "Legal guardian is less than 18 years old.":
      "Umuhagarariye ari munsi yimyaka 18.",
    "Legal guardian and dependent cannot be the same person":
      "Umuhagarariye n'usaba ntibagomba kugira umwirondoro umwe.",
    "Supporting documents not exist": "Nta nyandiko zishyigikira",
    "Selfie is missing": "Nta foro ibashije kuboneka",
    "Supporting Id proof is missing":
      "Inyandiko yerekana umwirondoro wemewe ntabwo yabonetse",
    "Masked phone number not found": "Numero ya terefone ntabwo yabonetse",
    "Selfie is not verified": "Kwifotoza ntabwo bigenzuwe",
    "Child not found in parent's data":
      "Umwana ntabashije kuboneka mu mwirondoro w'umubyeyi",
    "Request already exists with the same name and parent ID number":
      "Uyumwirondoro usanzwe uri muri sisteme",
    "Citizen photo is not available, provide phone number for skip selfie verification":
      "Ifoto ntishoboye kuboneka; nyamuneka tanga numero ya terefone kugirango ukomeze.",
    "AccessRight not found": "Kwinjira ntabwo byabonetse",
    "AccessRight detail not found": "Ntaburenganzira sisteme itanga bubonetse",
    "Access right not found for this module.":
      "Ntaburenganzira sisteme itanga bubonetse kuri icyigikorwa.",
    "Villages not found": "Nta mudugudu ibashije kuboneka",
    "Province not found": "Nta ntara ibashije kuboneka",
    "District not found": "Nta karere kabonetse",
    "Sectors not found": "Nta murenge ibonetse",
    "Sector not found": "Nta murenge ubonetse",
    "The sector is not a part of the district":
      "U murenge ntubarizwa mu karere wahisemo",
    "The cell is not a part of the sector":
      "Akagali ntikabarizwa mu murenge wahisemo",
    "The district is not a part of the province":
      "Akarere ntabwo kabarizwa mu ntara wahisemo",
    "Country not found": "Igihugu nticyabonetse",
    "Province already exists": "Intara isanzwe iri muri sisteme",
    "This province has been assigned to a district.":
      "Iyi ntara yahawe akarere.",
    "This province has been assigned to a sector.":
      "Iyi ntara yahawe umurenge.",
    "This province has been assigned to a cell.":
      "Iyi ntara yahujwe na a kagari.",
    "This province has been assigned to a village.":
      "Iyi ntara yahujwe n' umudugudu.",
    "This province has been assigned to a center.": "Iyi ntara yahawe ikigo.",
    "The village is not a part of the cell":
      "Umudugudu ntubarizwa mu kagali wahisemo",
    "Invalid citizenship": "Ubwenegihugu ntabwo bwemewe",
    "Citizenship is not {citizenship}": "Ubwenegihugu ntabwo ari bwo",
    "Supporting documents update successfully for idNumber":
      "Icyangombwa jyicyenerwa cyabitswe neza",
    "You have already requested a code that has not yet expire":
      "Wamaze guhabwa kode itararangira, ushobora kongera gusaba indi nyuma y'iminota 5",
    "Reviewer cannot start review for his / her own request":
      "Ntiwemerewe gukora kuri dosiye yawe, iy'uwo uhagarariye cyangwa umubyeyi wawe",
    "Some of the answers provided are not correct.": "Igisubuzo ntago aricyo",
    "Security questions answered successfully": "Igisubizo cyatanzwe nicyo",
    "Request already exists with NHP_SELFIE_CAPTURE_PENDING status":
      "Ubusabe busanzwe buri muri sisteme bufite sitatasi ya NHP_SELFIE_CAPTURE_PENDING",
    "Delete data successfully": "Gusiba byagenze neza",
  },
};

//  ) {
//         throw new BadRequestException(
//           'Reviewer cannot start review for his / her own request',
//         );
//       }
//       if (existPreEnroll.digitalAmbassadorNid == account.idNumber) {
//         throw new BadRequestException(
//           'Reviewer cannot start review for a request, he / she is the digital ambassador of',
//         );
//       }
//       if (
//         account.idNumber == existPreEnroll.fatherIDNumber ||
//         account.idNumber == existPreEnroll.motherIDNumber ||
//         account.idNumber == existPreEnroll.spouseIDNumber
//       ) {
//         throw new BadRequestException(
//           'Reviewer cannot start review for a request, he / she is the father / mother / spouse of the applicant',
//         );
//       }
//       if (account.idNumber == existPreEnroll.legalGuardianIdentifier) {
//         throw new BadRequestException(
//           'Reviewer cannot start review for a request, he / she is the legal guardian of the applicant',
//         );
//       }
