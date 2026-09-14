/**
 * Contextual Audio Router
 * In accordance with Hermes Contextual TTS Routing Manifest Spec & Build Plan rd03 §16
 * 
 * Maps 4-switch conversation context to exact pre-generated ElevenLabs assets:
 * route_key = {station_id}:{phrase_id}:{learnerGender}:{listenerGender}:{learnerRelativeAge}:{audience}
 * Total routes: 960 across 12 stations × 5 phrases.
 * Unique generated audio assets: 260.
 */

export const STATION_METADATA = {
  "01": {
    num: "01",
    id: "station_01",
    title: "At a Restaurant",
    prefix: "restaurant",
    hasFullLesson: false,
    phrases: [
      { id: "restaurant_01", index: 1, english: "Can I see the menu?", phonetic: "choh toy sem tehk-dun DOOK khong?", defaultVietnamese: "Cho tôi xem thực đơn được không?" },
      { id: "restaurant_02", index: 2, english: "I’d like to order this.", phonetic: "toy mwon goy mon nai", defaultVietnamese: "Tôi muốn gọi món này." },
      { id: "restaurant_03", index: 3, english: "Not spicy, please.", phonetic: "lam un khong kai", defaultVietnamese: "Làm ơn không cay." },
      { id: "restaurant_04", index: 4, english: "This is delicious.", phonetic: "mon nai ngon lam", defaultVietnamese: "Món này ngon lắm." },
      { id: "restaurant_05", index: 5, english: "Can I have the bill?", phonetic: "choh toy teen tee-en", defaultVietnamese: "Cho tôi tính tiền." }
    ]
  },
  "02": {
    num: "02",
    id: "station_02",
    title: "In a Grab / Taxi",
    prefix: "taxi",
    hasFullLesson: false,
    phrases: [
      { id: "taxi_01", index: 1, english: "Please take me here.", phonetic: "lam un choh toy den dai", defaultVietnamese: "Làm ơn cho tôi đến đây." },
      { id: "taxi_02", index: 2, english: "Please stop here.", phonetic: "yuhng uh dai DOOK roy", defaultVietnamese: "Dừng ở đây được rồi." },
      { id: "taxi_03", index: 3, english: "Please turn left.", phonetic: "reh chai", defaultVietnamese: "Rẽ trái." },
      { id: "taxi_04", index: 4, english: "Please turn right.", phonetic: "reh fy", defaultVietnamese: "Rẽ phải." },
      { id: "taxi_05", index: 5, english: "How long will it take?", phonetic: "mat bao lao?", defaultVietnamese: "Mất bao lâu?" }
    ]
  },
  "03": {
    num: "03",
    id: "station_03",
    title: "At a Café",
    prefix: "cafe",
    hasFullLesson: true,
    phrases: [
      { id: "cafe_01", index: 1, english: "One iced coffee, please.", phonetic: "choh toy mot kah-feh dah", defaultVietnamese: "Cho tôi một cà phê đá." },
      { id: "cafe_02", index: 2, english: "Less sugar, please.", phonetic: "eet doong toy", defaultVietnamese: "Ít đường thôi." },
      { id: "cafe_03", index: 3, english: "No milk, please.", phonetic: "khong soo-ah", defaultVietnamese: "Không sữa." },
      { id: "cafe_04", index: 4, english: "Can I have some water?", phonetic: "choh toy sin eet nook", defaultVietnamese: "Cho tôi xin ít nước." },
      { id: "cafe_05", index: 5, english: "Can I sit here?", phonetic: "toy ngoy dai DOOK khong?", defaultVietnamese: "Tôi ngồi đây được không?" }
    ]
  },
  "04": {
    num: "04",
    id: "station_04",
    title: "At Art Class",
    prefix: "art",
    hasFullLesson: false,
    phrases: [
      { id: "art_01", index: 1, english: "What are we doing today?", phonetic: "hom nai meeng lam zee?", defaultVietnamese: "Hôm nay mình làm gì?" },
      { id: "art_02", index: 2, english: "How do I do this?", phonetic: "kai nai lam sao?", defaultVietnamese: "Cái này làm sao?" },
      { id: "art_03", index: 3, english: "Can you show me?", phonetic: "ban chee choh toy DOOK khong?", defaultVietnamese: "Bạn chỉ cho tôi được không?" },
      { id: "art_04", index: 4, english: "I need another brush.", phonetic: "toy kan kai koh kahk", defaultVietnamese: "Tôi cần cái cọ khác." },
      { id: "art_05", index: 5, english: "I like this color.", phonetic: "toy teek mao nai", defaultVietnamese: "Tôi thích màu này." }
    ]
  },
  "05": {
    num: "05",
    id: "station_05",
    title: "At the Gym",
    prefix: "gym",
    hasFullLesson: false,
    phrases: [
      { id: "gym_01", index: 1, english: "Is anyone using this?", phonetic: "koh eye doong kai nai khong?", defaultVietnamese: "Có ai dùng cái này không?" },
      { id: "gym_02", index: 2, english: "How many sets?", phonetic: "bao new hip?", defaultVietnamese: "Bao nhiêu hiệp?" },
      { id: "gym_03", index: 3, english: "How many reps?", phonetic: "bao new lan?", defaultVietnamese: "Bao nhiêu lần?" },
      { id: "gym_04", index: 4, english: "Can you help me?", phonetic: "ban zoop toy DOOK khong?", defaultVietnamese: "Bạn giúp tôi được không?" },
      { id: "gym_05", index: 5, english: "I’m finished.", phonetic: "toy song roy", defaultVietnamese: "Tôi xong rồi." }
    ]
  },
  "06": {
    num: "06",
    id: "station_06",
    title: "Meeting Someone New",
    prefix: "meeting",
    hasFullLesson: false,
    phrases: [
      { id: "meeting_01", index: 1, english: "Hello, my name is Alan.", phonetic: "sin chow, toy ten la Alan", defaultVietnamese: "Xin chào, tôi tên là Alan." },
      { id: "meeting_02", index: 2, english: "What’s your name?", phonetic: "ban ten zee?", defaultVietnamese: "Bạn tên gì?" },
      { id: "meeting_03", index: 3, english: "Nice to meet you.", phonetic: "rat vui DOOK gap ban", defaultVietnamese: "Rất vui được gặp bạn." },
      { id: "meeting_04", index: 4, english: "Where are you from?", phonetic: "ban tuh dow den?", defaultVietnamese: "Bạn từ đâu đến?" },
      { id: "meeting_05", index: 5, english: "How long have you lived here?", phonetic: "ban song uh dai bao lao roy?", defaultVietnamese: "Bạn sống ở đây bao lâu rồi?" }
    ]
  },
  "07": {
    num: "07",
    id: "station_07",
    title: "Wi-Fi & Internet",
    prefix: "wifi",
    hasFullLesson: false,
    phrases: [
      { id: "wifi_01", index: 1, english: "Do you have Wi-Fi?", phonetic: "uh dai koh why-fy khong?", defaultVietnamese: "Ở đây có Wi-Fi không?" },
      { id: "wifi_02", index: 2, english: "What’s the Wi-Fi password?", phonetic: "mat cow why-fy la zee?", defaultVietnamese: "Mật khẩu Wi-Fi là gì?" },
      { id: "wifi_03", index: 3, english: "The internet isn’t working.", phonetic: "mang khong ho-at dong", defaultVietnamese: "Mạng không hoạt động." },
      { id: "wifi_04", index: 4, english: "The internet is very slow.", phonetic: "mang cham kwa", defaultVietnamese: "Mạng chậm quá." },
      { id: "wifi_05", index: 5, english: "Can I charge my phone here?", phonetic: "toy sak deen tho-ai uh dai DOOK khong?", defaultVietnamese: "Tôi sạc điện thoại ở đây được không?" }
    ]
  },
  "08": {
    num: "08",
    id: "station_08",
    title: "Shopping",
    prefix: "shopping",
    hasFullLesson: false,
    phrases: [
      { id: "shopping_01", index: 1, english: "How much is this?", phonetic: "kai nai bao new teen?", defaultVietnamese: "Cái này bao nhiêu tiền?" },
      { id: "shopping_02", index: 2, english: "That’s too expensive.", phonetic: "dat kwa", defaultVietnamese: "Đắt quá." },
      { id: "shopping_03", index: 3, english: "Do you have a bigger size?", phonetic: "koh size lon hun khong?", defaultVietnamese: "Có size lớn hơn không?" },
      { id: "shopping_04", index: 4, english: "Do you have a smaller size?", phonetic: "koh size nyoh hun khong?", defaultVietnamese: "Có size nhỏ hơn không?" },
      { id: "shopping_05", index: 5, english: "I’ll take this one.", phonetic: "toy lay kai nai", defaultVietnamese: "Tôi lấy cái này." }
    ]
  },
  "09": {
    num: "09",
    id: "station_09",
    title: "Asking for Directions",
    prefix: "directions",
    hasFullLesson: false,
    phrases: [
      { id: "directions_01", index: 1, english: "Where is the bathroom?", phonetic: "nyah veh-seeng uh dow?", defaultVietnamese: "Nhà vệ sinh ở đâu?" },
      { id: "directions_02", index: 2, english: "Where is this place?", phonetic: "choh nai uh dow?", defaultVietnamese: "Chỗ này ở đâu?" },
      { id: "directions_03", index: 3, english: "Is it far from here?", phonetic: "tuh dai den doh koh sah khong?", defaultVietnamese: "Từ đây đến đó có xa không?" },
      { id: "directions_04", index: 4, english: "Which way should I go?", phonetic: "toy dee doong nao?", defaultVietnamese: "Tôi đi đường nào?" },
      { id: "directions_05", index: 5, english: "Is it near here?", phonetic: "koh gan dai khong?", defaultVietnamese: "Có gần đây không?" }
    ]
  },
  "10": {
    num: "10",
    id: "station_10",
    title: "Everyday Conversation",
    prefix: "everyday",
    hasFullLesson: false,
    phrases: [
      { id: "everyday_01", index: 1, english: "How are you?", phonetic: "ban koh kweh khong?", defaultVietnamese: "Bạn có khỏe không?" },
      { id: "everyday_02", index: 2, english: "I’m good, thank you.", phonetic: "toy kweh, kam un", defaultVietnamese: "Tôi khỏe, cảm ơn." },
      { id: "everyday_03", index: 3, english: "What are you doing?", phonetic: "ban dang lam zee?", defaultVietnamese: "Bạn đang làm gì?" },
      { id: "everyday_04", index: 4, english: "Really?", phonetic: "vat sao?", defaultVietnamese: "Vậy sao?" },
      { id: "everyday_05", index: 5, english: "See you later.", phonetic: "gap lai sow", defaultVietnamese: "Gặp lại sau." }
    ]
  },
  "11": {
    num: "11",
    id: "station_11",
    title: "When You Don’t Understand",
    prefix: "repair",
    hasFullLesson: false,
    phrases: [
      { id: "repair_01", index: 1, english: "I don’t understand.", phonetic: "toy khong hew", defaultVietnamese: "Tôi không hiểu." },
      { id: "repair_02", index: 2, english: "Please speak more slowly.", phonetic: "lam un noy cham hun", defaultVietnamese: "Làm ơn nói chậm hơn." },
      { id: "repair_03", index: 3, english: "Can you say that again?", phonetic: "ban noy lai DOOK khong?", defaultVietnamese: "Bạn nói lại được không?" },
      { id: "repair_04", index: 4, english: "What does that mean?", phonetic: "kai doh koh ngee-ah zee?", defaultVietnamese: "Cái đó có nghĩa gì?" },
      { id: "repair_05", index: 5, english: "How do you say this in Vietnamese?", phonetic: "kai nai teen veet noy sao?", defaultVietnamese: "Cái này tiếng Việt nói sao?" }
    ]
  },
  "12": {
    num: "12",
    id: "station_12",
    title: "Everyday Problem-Solving",
    prefix: "problem",
    hasFullLesson: false,
    phrases: [
      { id: "problem_01", index: 1, english: "Excuse me.", phonetic: "sin loy", defaultVietnamese: "Xin lỗi." },
      { id: "problem_02", index: 2, english: "It’s okay / No problem.", phonetic: "khong sao", defaultVietnamese: "Không sao." },
      { id: "problem_03", index: 3, english: "Please wait a moment.", phonetic: "choh mot choot", defaultVietnamese: "Chờ một chút." },
      { id: "problem_04", index: 4, english: "I need help.", phonetic: "toy kan zoop duh", defaultVietnamese: "Tôi cần giúp đỡ." },
      { id: "problem_05", index: 5, english: "Can you help me with this?", phonetic: "ban zoop toy kai nai DOOK khong?", defaultVietnamese: "Bạn giúp tôi cái này được không?" }
    ]
  }
};

export class ContextualAudioRouter {
  constructor(options = {}) {
    this.basePath = options.basePath || "";
    this.routeIndex = new Map();
    this.isLoaded = false;
    this.loadPromise = null;

    if (options.routesData) {
      this.loadFromData(options.routesData);
    } else if (typeof window === "undefined" && typeof process !== "undefined") {
      try {
        const getRequire = process.getBuiltinModule ? process.getBuiltinModule("module")?.createRequire : null;
        const req = getRequire ? getRequire(import.meta.url) : (typeof require === "function" ? require : null);
        if (req) {
          const nodeFs = req("node:fs");
          const nodePath = req("node:path");
          const localPath = nodePath.resolve(process.cwd(), "public/audio/contextual/contextual_audio_routes.v1.json");
          if (nodeFs.existsSync(localPath)) {
            const raw = nodeFs.readFileSync(localPath, "utf8");
            const parsed = JSON.parse(raw);
            this.loadFromData(parsed);
          }
        }
      } catch (e) {}
    }
  }

  normalizeStationId(stationId) {
    if (!stationId) return "03";
    const str = String(stationId).trim().replace(/^station_/, "");
    return str.padStart(2, "0");
  }

  normalizePhraseId(phraseId, stationNum) {
    if (!phraseId) return `${STATION_METADATA[stationNum]?.prefix || "cafe"}_01`;
    return String(phraseId).trim().toLowerCase();
  }

  buildRouteKey(stationId, phraseId, context) {
    const stId = this.normalizeStationId(stationId);
    const phId = this.normalizePhraseId(phraseId, stId);
    const ctx = context || {};
    const learnerGender = ctx.learnerGender === "male" ? "male" : "female";
    const listenerGender = ctx.listenerGender === "male" ? "male" : "female";
    const learnerRelativeAge = ctx.learnerRelativeAge === "older" ? "older" : "younger";
    const audience = ctx.audience === "group" ? "group" : "one";

    return `${stId}:${phId}:${learnerGender}:${listenerGender}:${learnerRelativeAge}:${audience}`;
  }

  loadFromData(data) {
    if (!data) return 0;
    const routes = Array.isArray(data) ? data : (data.routes || []);
    this.routeIndex.clear();

    routes.forEach(r => {
      if (r && r.route_key) {
        this.routeIndex.set(r.route_key, r);
      }
    });

    this.isLoaded = true;
    return this.routeIndex.size;
  }

  async init(fetchUrl) {
    if (this.isLoaded && this.routeIndex.size > 0) return this.routeIndex.size;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      // 1. If in Node environment and file exists locally
      if (typeof window === "undefined") {
        try {
          const fs = await import("node:fs");
          const path = await import("node:path");
          const localPath = path.resolve(process.cwd(), "public/audio/contextual/contextual_audio_routes.v1.json");
          if (fs.existsSync(localPath)) {
            const raw = fs.readFileSync(localPath, "utf8");
            const parsed = JSON.parse(raw);
            this.loadFromData(parsed);
            return this.routeIndex.size;
          }
        } catch (e) {
          // Fall through to fetch
        }
      }

      // 2. Browser fetch
      let url = fetchUrl;
      if (!url) {
        const base = this.basePath ? (this.basePath.endsWith("/") ? this.basePath : `${this.basePath}/`) : "";
        url = `${base}audio/contextual/contextual_audio_routes.v1.json`;
      }

      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} while fetching contextual routes from ${url}`);
        }
        const data = await res.json();
        this.loadFromData(data);
        return this.routeIndex.size;
      } catch (err) {
        console.warn("[ContextualAudioRouter] Failed to load routes:", err.message);
        return 0;
      }
    })();

    return this.loadPromise;
  }

  resolveRoute(stationId, phraseId, context) {
    const routeKey = this.buildRouteKey(stationId, phraseId, context);
    const route = this.routeIndex.get(routeKey);

    if (!route) {
      console.warn("[CONTEXTUAL_AUDIO_ROUTE_MISS]", {
        routeKey,
        stationId,
        phraseId,
        context,
        availableRoutesCount: this.routeIndex.size
      });
      return null;
    }

    return {
      ...route,
      audio_path: route.public_path
    };
  }

  getStationPhrases(stationId, context) {
    const stNum = this.normalizeStationId(stationId);
    const meta = STATION_METADATA[stNum] || STATION_METADATA["03"];

    return meta.phrases.map(p => {
      const route = this.resolveRoute(stNum, p.id, context);
      return {
        id: p.id,
        index: p.index,
        english: p.english,
        phonetic: p.phonetic,
        sourceVietnamese: p.defaultVietnamese,
        renderedVietnamese: route ? route.rendered_vietnamese : p.defaultVietnamese,
        publicPath: route ? route.public_path : null,
        voice: route ? route.voice : null,
        routeKey: route ? route.route_key : null
      };
    });
  }

  getAllStationMetadata() {
    return STATION_METADATA;
  }
}
