/**
 * Offline Translation Engine for Milingua
 * Provides ultra-fast local bilingual dictionary translation, phrase matching,
 * rule-based token translation, and cached sentence lookup without internet connection.
 */

export type SupportedLang = 'it' | 'en' | 'es' | 'fr' | 'de' | 'pt';

export interface TranslationResult {
  translation: string;
  isOffline: boolean;
  matchType: 'exact' | 'pattern' | 'lexical' | 'cached' | 'ai';
  confidence: number;
}

// Key travel, conversational, and directional multi-lingual phrase matrix
interface PhraseMap {
  [key: string]: {
    it: string;
    en: string;
    es: string;
    fr: string;
    de: string;
    pt: string;
  };
}

const PHRASE_MATRIX: PhraseMap = {
  // Greetings & basic
  'hello': { it: 'Ciao', en: 'Hello', es: 'Hola', fr: 'Bonjour', de: 'Hallo', pt: 'Olá' },
  'good morning': { it: 'Buongiorno', en: 'Good morning', es: 'Buenos días', fr: 'Bonjour', de: 'Guten Morgen', pt: 'Bom dia' },
  'good evening': { it: 'Buonasera', en: 'Good evening', es: 'Buenas tardes', fr: 'Bonsoir', de: 'Guten Abend', pt: 'Boa tarde' },
  'good night': { it: 'Buonanotte', en: 'Good night', es: 'Buenas noches', fr: 'Bonne nuit', de: 'Gute Nacht', pt: 'Boa noite' },
  'how are you': { it: 'Come stai?', en: 'How are you?', es: '¿Cómo estás?', fr: 'Comment allez-vous ?', de: 'Wie geht es Ihnen?', pt: 'Como você está?' },
  'im fine thank you': { it: 'Sto bene, grazie', en: "I'm fine, thank you", es: 'Estoy bien, gracias', fr: 'Je vais bien, merci', de: 'Mir geht es gut, danke', pt: 'Estou bem, obrigado' },
  'please': { it: 'Per favore', en: 'Please', es: 'Por favor', fr: "S'il vous plaît", de: 'Bitte', pt: 'Por favor' },
  'thank you': { it: 'Grazie', en: 'Thank you', es: 'Gracias', fr: 'Merci', de: 'Danke', pt: 'Obrigado' },
  'thank you very much': { it: 'Grazie mille', en: 'Thank you very much', es: 'Muchas gracias', fr: 'Merci beaucoup', de: 'Vielen Dank', pt: 'Muito obrigado' },
  'you are welcome': { it: 'Prego', en: "You're welcome", es: 'De nada', fr: 'De rien', de: 'Gern geschehen', pt: 'De nada' },
  'yes': { it: 'Sì', en: 'Yes', es: 'Sí', fr: 'Oui', de: 'Ja', pt: 'Sim' },
  'no': { it: 'No', en: 'No', es: 'No', fr: 'Non', de: 'Nein', pt: 'Não' },
  'excuse me': { it: 'Mi scusi', en: 'Excuse me', es: 'Disculpe', fr: 'Excusez-moi', de: 'Entschuldigung', pt: 'Com licença' },
  'im sorry': { it: 'Mi dispiace', en: "I'm sorry", es: 'Lo siento', fr: 'Pardon', de: 'Es tut mir leid', pt: 'Desculpe' },
  'goodbye': { it: 'Arrivederci', en: 'Goodbye', es: 'Adiós', fr: 'Au revoir', de: 'Auf Wiedersehen', pt: 'Adeus' },
  'see you later': { it: 'A dopo', en: 'See you later', es: 'Hasta luego', fr: 'À plus tard', de: 'Bis später', pt: 'Até logo' },

  // Understanding & Communication
  'do you speak english': { it: 'Parla inglese?', en: 'Do you speak English?', es: '¿Habla inglés?', fr: 'Parlez-vous anglais ?', de: 'Sprechen Sie Englisch?', pt: 'Fala inglês?' },
  'do you speak italian': { it: 'Parla italiano?', en: 'Do you speak Italian?', es: '¿Habla italiano?', fr: 'Parlez-vous italien ?', de: 'Sprechen Sie Italienisch?', pt: 'Fala italiano?' },
  'i dont understand': { it: 'Non capisco', en: "I don't understand", es: 'No entiendo', fr: 'Je ne comprends pas', de: 'Ich verstehe nicht', pt: 'Não entendo' },
  'please speak slower': { it: 'Parli più lentamente per favore', en: 'Please speak slower', es: 'Por favor hable más despacio', fr: 'Parlez plus lentement svp', de: 'Bitte sprechen Sie langsamer', pt: 'Fale mais devagar, por favor' },
  'can you repeat': { it: 'Può ripetere?', en: 'Can you repeat?', es: '¿Puede repetir?', fr: 'Pouvez-vous répéter ?', de: 'Können Sie das wiederholen?', pt: 'Pode repetir?' },
  'i understand': { it: 'Ho capito', en: 'I understand', es: 'Entendido', fr: "J'ai compris", de: 'Ich habe verstanden', pt: 'Entendi' },
  'what did you say': { it: 'Cosa ha detto?', en: 'What did you say?', es: '¿Qué dijo?', fr: "Qu'avez-vous dit ?", de: 'Was haben Sie gesagt?', pt: 'O que você disse?' },

  // Directions & Travel
  'where is': { it: 'Dov\'è...', en: 'Where is...', es: '¿Dónde está...?', fr: 'Où est... ?', de: 'Wo ist...?', pt: 'Onde fica...?' },
  'where is the train station': { it: 'Dov\'è la stazione ferroviaria?', en: 'Where is the train station?', es: '¿Dónde está la estación de tren?', fr: 'Où est la gare ?', de: 'Wo ist der Bahnhof?', pt: 'Onde fica a estação de trem?' },
  'where is the airport': { it: 'Dov\'è l\'aeroporto?', en: 'Where is the airport?', es: '¿Dónde está el aeropuerto?', fr: 'Où est l\'aéroport ?', de: 'Wo ist der Flughafen?', pt: 'Onde fica o aeroporto?' },
  'where is the metro': { it: 'Dov\'è la metropolitana?', en: 'Where is the metro?', es: '¿Dónde está el metro?', fr: 'Où est le métro ?', de: 'Wo ist die U-Bahn?', pt: 'Onde fica o metrô?' },
  'where is the bathroom': { it: 'Dov\'è il bagno?', en: 'Where is the bathroom?', es: '¿Dónde está el baño?', fr: 'Où sont les toilettes ?', de: 'Wo ist die Toilette?', pt: 'Onde fica o banheiro?' },
  'where is the hotel': { it: 'Dov\'è l\'hotel?', en: 'Where is the hotel?', es: '¿Dónde está el hotel?', fr: 'Où est l\'hôtel ?', de: 'Wo ist das Hotel?', pt: 'Onde fica o hotel?' },
  'turn left': { it: 'Giri a sinistra', en: 'Turn left', es: 'Gire a la izquierda', fr: 'Tournez à gauche', de: 'Biegen Sie links ab', pt: 'Vire à esquerda' },
  'turn right': { it: 'Giri a destra', en: 'Turn right', es: 'Gire a la derecha', fr: 'Tournez à droite', de: 'Biegen Sie rechts ab', pt: 'Vire à direita' },
  'go straight': { it: 'Vada dritto', en: 'Go straight', es: 'Siga recto', fr: 'Allez tout droit', de: 'Gehen Sie geradeaus', pt: 'Siga em frente' },
  'is it far': { it: 'È lontano?', en: 'Is it far?', es: '¿Está lejos?', fr: 'Est-ce loin ?', de: 'Ist es weit?', pt: 'É longe?' },
  'how do i get to': { it: 'Come arrivo a...', en: 'How do I get to...', es: '¿Cómo llego a...?', fr: 'Comment aller à... ?', de: 'Wie komme ich zu...?', pt: 'Como chego a...?' },

  // Restaurant & Food
  'the bill please': { it: 'Il conto per favore', en: 'The bill please', es: 'La cuenta por favor', fr: "L'addition s'il vous plaît", de: 'Die Rechnung bitte', pt: 'A conta por favor' },
  'a table for two': { it: 'Un tavolo per due', en: 'A table for two', es: 'Una mesa para dos', fr: 'Une table pour deux', de: 'Ein Tisch für zwei', pt: 'Uma mesa para dois' },
  'the menu please': { it: 'Il menù per favore', en: 'The menu please', es: 'La carta por favor', fr: 'Le menu s\'il vous plaît', de: 'Die Speisekarte bitte', pt: 'O cardápio por favor' },
  'water please': { it: 'Acqua per favore', en: 'Water please', es: 'Agua por favor', fr: "De l'eau s'il vous plaît", de: 'Wasser bitte', pt: 'Água por favor' },
  'coffee please': { it: 'Un caffè per favore', en: 'A coffee please', es: 'Un café por favor', fr: 'Un café s\'il vous plaît', de: 'Einen Kaffee bitte', pt: 'Um café por favor' },
  'can i pay with card': { it: 'Posso pagare con carta?', en: 'Can I pay by card?', es: '¿Puedo pagar con tarjeta?', fr: 'Puis-je payer par carte ?', de: 'Kann ich mit Karte zahlen?', pt: 'Posso pagar com cartão?' },
  'cash only': { it: 'Solo contanti', en: 'Cash only', es: 'Solo efectivo', fr: 'En espèces uniquement', de: 'Nur Bargeld', pt: 'Somente dinheiro' },
  'it is delicious': { it: 'È delizioso', en: 'It is delicious', es: 'Está delicioso', fr: "C'est délicieux", de: 'Es ist köstlich', pt: 'Está delicioso' },

  // Shopping & Prices
  'how much does it cost': { it: 'Quanto costa?', en: 'How much does it cost?', es: '¿Cuánto cuesta?', fr: 'Combien ça coûte ?', de: 'Wie viel kostet das?', pt: 'Quanto custa?' },
  'it is too expensive': { it: 'È troppo caro', en: 'It is too expensive', es: 'Es demasiado caro', fr: "C'est trop cher", de: 'Es ist zu teuer', pt: 'É muito caro' },
  'do you have a smaller size': { it: 'Ha una taglia più piccola?', en: 'Do you have a smaller size?', es: '¿Tiene una talla más pequeña?', fr: 'Avez-vous une taille plus petite ?', de: 'Haben Sie eine kleinere Größe?', pt: 'Tem um tamanho menor?' },
  'i will take it': { it: 'Lo prendo', en: "I'll take it", es: 'Me lo llevo', fr: 'Je le prends', de: 'Ich nehme es', pt: 'Vou levar' },

  // Hotel & Accommodation
  'i have a reservation': { it: 'Ho una prenotazione', en: 'I have a reservation', es: 'Tengo una reserva', fr: "J'ai une réservation", de: 'Ich habe eine Reservierung', pt: 'Tenho uma reserva' },
  'what is the wifi password': { it: 'Qual è la password del Wi-Fi?', en: 'What is the Wi-Fi password?', es: '¿Cuál es la contraseña del wifi?', fr: 'Quel est le mot de passe du Wi-Fi ?', de: 'Wie lautet das WLAN-Passwort?', pt: 'Qual é a senha do Wi-Fi?' },
  'what time is breakfast': { it: 'A che ora è la colazione?', en: 'What time is breakfast?', es: '¿A qué hora es el desayuno?', fr: 'À quelle heure est le petit-déjeuner ?', de: 'Um wie viel Uhr gibt es Frühstück?', pt: 'A que horas é o café da manhã?' },
  'check out': { it: 'Check-out', en: 'Check-out', es: 'Salida / Check-out', fr: 'Départ / Check-out', de: 'Abreise / Check-out', pt: 'Check-out' },

  // Emergency & Medical
  'help': { it: 'Aiuto!', en: 'Help!', es: '¡Ayuda!', fr: 'Au secours !', de: 'Hilfe!', pt: 'Socorro!' },
  'call an ambulance': { it: 'Chiamate un\'ambulanza', en: 'Call an ambulance', es: 'Llamen a una ambulancia', fr: 'Appelez une ambulance', de: 'Rufen Sie einen Krankenwagen', pt: 'Chame uma ambulância' },
  'call the police': { it: 'Chiamate la polizia', en: 'Call the police', es: 'Llamen a la policía', fr: 'Appelez la police', de: 'Rufen Sie die Polizei', pt: 'Chame a polícia' },
  'i need a doctor': { it: 'Ho bisogno di un medico', en: 'I need a doctor', es: 'Necesito un médico', fr: "J'ai besoin d'un médecin", de: 'Ich brauche einen Arzt', pt: 'Preciso de um médico' },
  'where is the pharmacy': { it: 'Dov\'è la farmacia?', en: 'Where is the pharmacy?', es: '¿Dónde está la farmacia?', fr: 'Où est la pharmacie ?', de: 'Wo ist die Apotheke?', pt: 'Onde fica a farmácia?' },
  'i dont feel well': { it: 'Non mi sento bene', en: "I don't feel well", es: 'No me encuentro bien', fr: 'Je ne me sens pas bien', de: 'Ich fühle mich nicht wohl', pt: 'Não me sinto bem' },

  // Meeting / Conversation flow
  'nice to meet you': { it: 'Piacere di conoscerti', en: 'Nice to meet you', es: 'Mucho gusto', fr: 'Ravi de vous rencontrer', de: 'Freut mich, Sie kennenzulernen', pt: 'Prazer em conhecê-lo' },
  'my name is': { it: 'Mi chiamo...', en: 'My name is...', es: 'Me llamo...', fr: 'Je m\'appelle...', de: 'Ich heiße...', pt: 'Meu nome é...' },
  'what is your name': { it: 'Come ti chiami?', en: 'What is your name?', es: '¿Cómo te llamas?', fr: 'Comment vous appelez-vous ?', de: 'Wie heißen Sie?', pt: 'Como você se chama?' },
  'i agree': { it: 'Sono d\'accordo', en: 'I agree', es: 'Estoy de acuerdo', fr: "Je suis d'accord", de: 'Ich stimme zu', pt: 'Concordo' },
  'exactly': { it: 'Esattamente', en: 'Exactly', es: 'Exactamente', fr: 'Exactement', de: 'Genau', pt: 'Exatamente' },
  'of course': { it: 'Certamente', en: 'Of course', es: 'Por supuesto', fr: 'Bien sûr', de: 'Natürlich', pt: 'Com certeza' },
  'really': { it: 'Davvero?', en: 'Really?', es: '¿De verdad?', fr: 'Vraiment ?', de: 'Wirklich?', pt: 'Sério?' },
  'what do you think': { it: 'Cosa ne pensi?', en: 'What do you think?', es: '¿Qué opinas?', fr: "Qu'en pensez-vous ?", de: 'Was denkst du?', pt: 'O que você acha?' },
  'lets continue': { it: 'Continuiamo', en: "Let's continue", es: 'Continuemos', fr: 'Continuons', de: 'Machen wir weiter', pt: 'Vamos continuar' },
  'wait a moment': { it: 'Aspetti un momento', en: 'Wait a moment', es: 'Espere un momento', fr: 'Attendez un instant', de: 'Warten Sie einen Moment', pt: 'Espere um momento' },
  'im listening': { it: 'Ti ascolto', en: "I'm listening", es: 'Te escucho', fr: 'Je vous écoute', de: 'Ich höre zu', pt: 'Estou ouvindo' },
  'ok': { it: 'Va bene', en: 'OK', es: 'De acuerdo', fr: "D'accord", de: 'In Ordnung', pt: 'Está bem' },
};

// Word-level lexicon for compositional offline translation
const LEXICON: Record<string, Record<SupportedLang, string>> = {
  // Pronouns
  'io': { it: 'io', en: 'I', es: 'yo', fr: 'je', de: 'ich', pt: 'eu' },
  'tu': { it: 'tu', en: 'you', es: 'tú', fr: 'tu', de: 'du', pt: 'você' },
  'noi': { it: 'noi', en: 'we', es: 'nosotros', fr: 'nous', de: 'wir', pt: 'nós' },
  'lui': { it: 'lui', en: 'he', es: 'él', fr: 'il', de: 'er', pt: 'ele' },
  'lei': { it: 'lei', en: 'she', es: 'ella', fr: 'elle', de: 'sie', pt: 'ela' },
  'loro': { it: 'loro', en: 'they', es: 'ellos', fr: 'ils', de: 'sie', pt: 'eles' },

  // Verbs (present / common)
  'sono': { it: 'sono', en: 'am/are', es: 'soy/estoy', fr: 'suis', de: 'bin/sind', pt: 'sou/estou' },
  'è': { it: 'è', en: 'is', es: 'es/está', fr: 'est', de: 'ist', pt: 'é/está' },
  'ha': { it: 'ha', en: 'has', es: 'tiene', fr: 'a', de: 'hat', pt: 'tem' },
  'ho': { it: 'ho', en: 'have', es: 'tengo', fr: 'ai', de: 'habe', pt: 'tenho' },
  'voglio': { it: 'voglio', en: 'want', es: 'quiero', fr: 'veux', de: 'will', pt: 'quero' },
  'posso': { it: 'posso', en: 'can', es: 'puedo', fr: 'peux', de: 'kann', pt: 'posso' },
  'andare': { it: 'andare', en: 'go', es: 'ir', fr: 'aller', de: 'gehen', pt: 'ir' },
  'mangiare': { it: 'mangiare', en: 'eat', es: 'comer', fr: 'manger', de: 'essen', pt: 'comer' },
  'bere': { it: 'bere', en: 'drink', es: 'beber', fr: 'boire', de: 'trinken', pt: 'beber' },
  'vedere': { it: 'vedere', en: 'see', es: 'ver', fr: 'voir', de: 'sehen', pt: 'ver' },
  'capire': { it: 'capire', en: 'understand', es: 'entender', fr: 'comprendre', de: 'verstehen', pt: 'entender' },
  'parlare': { it: 'parlare', en: 'speak', es: 'hablar', fr: 'parler', de: 'sprechen', pt: 'falar' },
  'comprare': { it: 'comprare', en: 'buy', es: 'comprar', fr: 'acheter', de: 'kaufen', pt: 'comprar' },
  'arrivare': { it: 'arrivare', en: 'arrive', es: 'llegar', fr: 'arriver', de: 'ankommen', pt: 'chegar' },
  'aspettare': { it: 'aspettare', en: 'wait', es: 'esperar', fr: 'attendre', de: 'warten', pt: 'esperar' },

  // Nouns
  'tempo': { it: 'tempo', en: 'time/weather', es: 'tiempo', fr: 'temps', de: 'Zeit/Wetter', pt: 'tempo' },
  'ora': { it: 'ora', en: 'hour/now', es: 'hora/ahora', fr: 'heure', de: 'Stunde/jetzt', pt: 'hora/agora' },
  'giorno': { it: 'giorno', en: 'day', es: 'día', fr: 'jour', de: 'Tag', pt: 'dia' },
  'amico': { it: 'amico', en: 'friend', es: 'amigo', fr: 'ami', de: 'Freund', pt: 'amigo' },
  'strada': { it: 'strada', en: 'street', es: 'calle', fr: 'rue', de: 'Straße', pt: 'rua' },
  'città': { it: 'città', en: 'city', es: 'ciudad', fr: 'ville', de: 'Stadt', pt: 'cidade' },
  'paese': { it: 'paese', en: 'country', es: 'país', fr: 'pays', de: 'Land', pt: 'país' },
  'macchina': { it: 'macchina', en: 'car', es: 'coche', fr: 'voiture', de: 'Auto', pt: 'carro' },
  'treno': { it: 'treno', en: 'train', es: 'tren', fr: 'train', de: 'Zug', pt: 'trem' },
  'aereo': { it: 'aereo', en: 'plane', es: 'avión', fr: 'avion', de: 'Flugzeug', pt: 'avião' },
  'casa': { it: 'casa', en: 'house', es: 'casa', fr: 'maison', de: 'Haus', pt: 'casa' },
  'lavoro': { it: 'lavoro', en: 'work', es: 'trabajo', fr: 'travail', de: 'Arbeit', pt: 'trabalho' },
  'soldi': { it: 'soldi', en: 'money', es: 'dinero', fr: 'argent', de: 'Geld', pt: 'dinheiro' },
  'biglietto': { it: 'biglietto', en: 'ticket', es: 'billete', fr: 'billet', de: 'Ticket', pt: 'bilhete' },

  // Adjectives & Connectors
  'buono': { it: 'buono', en: 'good', es: 'bueno', fr: 'bon', de: 'gut', pt: 'bom' },
  'bello': { it: 'bello', en: 'beautiful', es: 'hermoso', fr: 'beau', de: 'schön', pt: 'bonito' },
  'grande': { it: 'grande', en: 'big', es: 'grande', fr: 'grand', de: 'groß', pt: 'grande' },
  'piccolo': { it: 'piccolo', en: 'small', es: 'pequeño', fr: 'petit', de: 'klein', pt: 'pequeno' },
  'nuovo': { it: 'nuovo', en: 'new', es: 'nuevo', fr: 'nouveau', de: 'neu', pt: 'novo' },
  'veloce': { it: 'veloce', en: 'fast', es: 'rápido', fr: 'rapide', de: 'schnell', pt: 'rápido' },
  'molto': { it: 'molto', en: 'very/much', es: 'muy/mucho', fr: 'très/beaucoup', de: 'sehr/viel', pt: 'muito' },
  'poco': { it: 'poco', en: 'little', es: 'poco', fr: 'peu', de: 'wenig', pt: 'pouco' },
  'qui': { it: 'qui', en: 'here', es: 'aquí', fr: 'ici', de: 'hier', pt: 'aqui' },
  'lì': { it: 'lì', en: 'there', es: 'allí', fr: 'là', de: 'dort', pt: 'lá' },
  'adesso': { it: 'adesso', en: 'now', es: 'ahora', fr: 'maintenant', de: 'jetzt', pt: 'agora' },
  'sempre': { it: 'sempre', en: 'always', es: 'siempre', fr: 'toujours', de: 'immer', pt: 'sempre' },
  'mai': { it: 'mai', en: 'never', es: 'nunca', fr: 'jamais', de: 'nie', pt: 'nunca' },
  'con': { it: 'con', en: 'with', es: 'con', fr: 'avec', de: 'mit', pt: 'com' },
  'senza': { it: 'senza', en: 'without', es: 'sin', fr: 'sans', de: 'ohne', pt: 'sem' },
  'perché': { it: 'perché', en: 'why/because', es: 'por qué/porque', fr: 'pourquoi/parce que', de: 'warum/weil', pt: 'por que/porque' },
};

// Build reverse lookup index for fast parsing from any supported language
interface InvertedEntry {
  lemmaKey: string;
  lang: SupportedLang;
}
const INVERTED_INDEX = new Map<string, InvertedEntry>();

// Initialize inverted indices
Object.keys(PHRASE_MATRIX).forEach((phraseKey) => {
  const row = PHRASE_MATRIX[phraseKey];
  (Object.keys(row) as SupportedLang[]).forEach((lang) => {
    const val = cleanText(row[lang]);
    if (val) {
      INVERTED_INDEX.set(`${lang}:${val}`, { lemmaKey: phraseKey, lang });
    }
  });
});

function cleanText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Offline Dynamic Cache Storage (persisted in localStorage)
const CACHE_STORAGE_KEY = 'omni_offline_translations_v1';

function getPersistentCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveOnlineTranslationToOfflineCache(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  translatedText: string
) {
  try {
    const cache = getPersistentCache();
    const key = `${sourceLang.toLowerCase()}->${targetLang.toLowerCase()}:${cleanText(sourceText)}`;
    cache[key] = translatedText;
    // Keep reasonable max size (last 200 items)
    const keys = Object.keys(cache);
    if (keys.length > 250) {
      delete cache[keys[0]];
    }
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Fast language detector for the 6 target languages
 */
export function detectLanguageOffline(text: string): SupportedLang {
  const t = ` ${text.toLowerCase()} `;

  // Distinctive markers
  if (/\b(und|nicht|ich|ist|sie|der|die|das|wir|ein|haben|bitte|danke)\b/.test(t) || /[äöüß]/.test(t)) {
    return 'de';
  }
  if (/\b(le|la|les|un|une|des|est|sont|dans|pour|avec|vous|nous|bonjour|merci)\b/.test(t) || /[œç]/.test(t)) {
    return 'fr';
  }
  if (/\b(the|is|are|you|have|this|that|with|for|and|not|what|where)\b/.test(t)) {
    return 'en';
  }
  if (/\b(el|los|las|del|por|para|con|está|estoy|hola|gracias|bueno|qué)\b/.test(t) || /[ñ¿¡]/.test(t)) {
    return 'es';
  }
  if (/\b(não|com|para|você|obrigado|muito|está|estou|olá|onde|fazer)\b/.test(t) || /[ãõê]/.test(t)) {
    return 'pt';
  }
  if (/\b(il|lo|la|i|gli|le|sono|ho|ha|ciao|grazie|per favore|dove|cosa)\b/.test(t)) {
    return 'it';
  }

  return 'en'; // default fallback
}

/**
 * Translates an utterance using local offline databases and rules
 */
export function translateOffline(
  text: string,
  sourceLang: SupportedLang | 'auto',
  targetLang: SupportedLang
): TranslationResult {
  const effectiveSource = sourceLang === 'auto' ? detectLanguageOffline(text) : sourceLang;

  // 1. Check persistent user session cache (from previously translated sentences)
  const cache = getPersistentCache();
  const cacheKey = `${effectiveSource}->${targetLang}:${cleanText(text)}`;
  if (cache[cacheKey]) {
    return {
      translation: cache[cacheKey],
      isOffline: true,
      matchType: 'cached',
      confidence: 0.98,
    };
  }

  // 2. Exact Phrase Match
  const cleanedInput = cleanText(text);
  const phraseMatch = INVERTED_INDEX.get(`${effectiveSource}:${cleanedInput}`);
  if (phraseMatch && PHRASE_MATRIX[phraseMatch.lemmaKey]) {
    const targetText = PHRASE_MATRIX[phraseMatch.lemmaKey][targetLang];
    if (targetText) {
      return {
        translation: targetText,
        isOffline: true,
        matchType: 'exact',
        confidence: 0.95,
      };
    }
  }

  // 3. Partial / Substring Phrase Pattern matching
  for (const phraseKey of Object.keys(PHRASE_MATRIX)) {
    const phraseObj = PHRASE_MATRIX[phraseKey];
    const sourcePhrase = cleanText(phraseObj[effectiveSource] || '');
    if (sourcePhrase && sourcePhrase.length > 3 && cleanedInput.includes(sourcePhrase)) {
      const targetPhrase = phraseObj[targetLang];
      // If the input is almost the phrase, substitute
      if (cleanedInput.length <= sourcePhrase.length + 8) {
        return {
          translation: targetPhrase,
          isOffline: true,
          matchType: 'pattern',
          confidence: 0.85,
        };
      }
    }
  }

  // 4. Lexicon-based Word-by-Word translation with grammar heuristics
  const words = text.split(/\s+/);
  const translatedWords = words.map((rawWord) => {
    const cleanWord = cleanText(rawWord);
    if (!cleanWord) return rawWord;

    // Direct lookup in LEXICON
    for (const key of Object.keys(LEXICON)) {
      const item = LEXICON[key];
      const sourceWord = cleanText(item[effectiveSource] || '');
      if (sourceWord === cleanWord || sourceWord.split('/').includes(cleanWord)) {
        const tr = item[targetLang];
        return tr.includes('/') ? tr.split('/')[0] : tr;
      }
    }

    // Number translation
    const num = Number(cleanWord);
    if (!isNaN(num)) return rawWord;

    return rawWord; // retain original name/word
  });

  const assembled = translatedWords.join(' ');
  return {
    translation: assembled,
    isOffline: true,
    matchType: 'lexical',
    confidence: 0.65,
  };
}
