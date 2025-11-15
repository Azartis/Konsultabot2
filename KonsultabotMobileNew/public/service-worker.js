// KonsultaBot Service Worker for Offline Support
const CACHE_NAME = 'konsultabot-v1';
const OFFLINE_CACHE = 'konsultabot-offline-v1';

// Files to cache for offline use
const CACHE_FILES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Offline responses for different languages
const OFFLINE_RESPONSES = {
  english: {
    greeting: "Hello! I'm KonsultaBot. I'm currently offline, but I can still help with basic campus information.",
    fallback: "I'm currently offline. Here's some basic EVSU Dulag information: We offer programs in Education, Business, and Computer Science. The campus has a library, computer lab, and gymnasium. For more details, please try again when you're online."
  },
  bisaya: {
    greeting: "Kumusta! Ako si KonsultaBot. Offline ko karon, pero makatabang gihapon ko sa basic campus information.",
    fallback: "Offline ko karon. Ania ang basic info sa EVSU Dulag: Naa'y programs sa Education, Business, ug Computer Science. Ang campus naa'y library, computer lab, ug gymnasium."
  },
  waray: {
    greeting: "Maupay nga adlaw! Ako si KonsultaBot. Offline ako karon, pero makakabulig pa ako han basic campus information.",
    fallback: "Offline ako karon. Ire an basic info han EVSU Dulag: Mayda programs ha Education, Business, ngan Computer Science. An campus mayda library, computer lab, ngan gymnasium."
  },
  tagalog: {
    greeting: "Kumusta! Ako si KonsultaBot. Offline ako ngayon, pero makakatulong pa rin ako sa basic campus information.",
    fallback: "Offline ako ngayon. Narito ang basic info ng EVSU Dulag: May mga programs sa Education, Business, at Computer Science. Ang campus ay may library, computer lab, at gymnasium."
  }
};

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(CACHE_FILES);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Handle API requests
  if (event.request.url.includes('/api/chat/send')) {
    event.respondWith(handleChatRequest(event.request));
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, return offline page
        return caches.match('/');
      })
  );
});

// Handle chat requests when offline
async function handleChatRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Network failed, provide offline response
    const requestData = await request.json().catch(() => ({}));
    const language = requestData.language || 'english';
    const message = requestData.message || '';
    
    let offlineResponse = generateOfflineResponse(message, language);
    
    return new Response(JSON.stringify({
      response: offlineResponse,
      language: language,
      mode: 'offline',
      confidence: 0.8,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

// Generate appropriate offline response
function generateOfflineResponse(message, language) {
  const responses = OFFLINE_RESPONSES[language] || OFFLINE_RESPONSES.english;
  const messageLower = message.toLowerCase();
  
  // Check for greetings
  if (messageLower.includes('hello') || messageLower.includes('hi') || 
      messageLower.includes('kumusta') || messageLower.includes('maupay')) {
    return responses.greeting;
  }
  
  // Check for specific topics
  if (messageLower.includes('course') || messageLower.includes('program') || 
      messageLower.includes('kurso')) {
    return language === 'english' ? 
      "EVSU Dulag offers undergraduate programs in Education, Business Administration, and Computer Science. Each program has specific requirements and duration." :
      language === 'bisaya' ?
      "Ang EVSU Dulag nag-offer og undergraduate programs sa Education, Business Administration, ug Computer Science." :
      language === 'waray' ?
      "An EVSU Dulag nag-offer hin undergraduate programs ha Education, Business Administration, ngan Computer Science." :
      "Ang EVSU Dulag ay nag-offer ng undergraduate programs sa Education, Business Administration, at Computer Science.";
  }
  
  if (messageLower.includes('library') || messageLower.includes('libro')) {
    return language === 'english' ?
      "The EVSU Dulag library is located on the main campus building. It provides study areas, books, and computer access for students." :
      language === 'bisaya' ?
      "Ang library sa EVSU Dulag naa sa main campus building. Naa'y study areas, books, ug computer access." :
      language === 'waray' ?
      "An library han EVSU Dulag naa ha main campus building. Mayda study areas, books, ngan computer access." :
      "Ang library ng EVSU Dulag ay nasa main campus building. May study areas, books, at computer access.";
  }
  
  // Default fallback
  return responses.fallback;
}

// Message to main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
