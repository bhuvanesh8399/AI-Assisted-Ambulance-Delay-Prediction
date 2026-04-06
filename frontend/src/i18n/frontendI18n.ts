export type FrontendLocale = "en" | "ta";

export const frontendI18n = {
  en: {
    tripId: "Trip ID",
    tripIdPlaceholder: "Enter trip ID",
    load: "Load",
    polling: "Polling",
    live: "LIVE",
    stale: "STALE",
    offline: "OFFLINE",
    lastUpdated: "Last updated",
    pilotDemo: "Pilot Demo",
    usePhoneBackup: "Use phone backup if updates are delayed",
    waitingForFeed: "Waiting for live feed",
    secondsAgo: "s ago",
    english: "EN",
    tamil: "தமிழ்",
  },
  ta: {
    tripId: "பயண ஐடி",
    tripIdPlaceholder: "பயண ஐடியை உள்ளிடவும்",
    load: "ஏற்று",
    polling: "புதுப்பிப்பு இடைவெளி",
    live: "நேரலை",
    stale: "தாமதமானது",
    offline: "இணைப்பு இல்லை",
    lastUpdated: "கடைசியாக புதுப்பிப்பு",
    pilotDemo: "முன்மாதிரி காட்சி",
    usePhoneBackup: "புதுப்பிப்பு தாமதமானால் தொலைபேசி மாற்று முறையை பயன்படுத்தவும்",
    waitingForFeed: "நேரடி தரவுக்காக காத்திருக்கிறது",
    secondsAgo: "விநாடிகள் முன்",
    english: "EN",
    tamil: "தமிழ்",
  },
} as const;

export const frontendText = frontendI18n;
