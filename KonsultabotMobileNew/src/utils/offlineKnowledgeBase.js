// Offline Knowledge Base for KonsultaBot
// Contains common questions and answers that work without internet

export const knowledgeBase = {
  // IT Support
  it_support: {
    keywords: ['computer', 'laptop', 'wifi', 'internet', 'windows', 'mac', 'slow', 'freeze', 'crash', 'printer', 'network', 'password', 'email', 'software', 'install'],
    responses: [
      {
        keywords: ['slow', 'freeze', 'lag'],
        answer: "For a slow computer:\n1. Close unused programs\n2. Clear browser cache\n3. Restart your computer\n4. Check for malware\n5. Update your software\n\nIf the problem persists, contact EVSU IT support."
      },
      {
        keywords: ['wifi', 'internet', 'connection', 'network'],
        answer: "Network troubleshooting:\n1. Check if WiFi is turned on\n2. Restart your router\n3. Forget and reconnect to the network\n4. Check if other devices work\n5. Contact EVSU network admin if campus WiFi\n\nEVSU IT Office: (053) 321-8000"
      },
      {
        keywords: ['printer', 'print'],
        answer: "Printer issues:\n1. Check if printer is on and connected\n2. Check paper and ink levels\n3. Restart printer and computer\n4. Reinstall printer drivers\n5. Clear print queue\n\nFor EVSU lab printers, contact the computer lab staff."
      },
      {
        keywords: ['password', 'forgot', 'reset'],
        answer: "Password recovery:\n1. Use 'Forgot Password' link on login page\n2. Check your EVSU email for reset link\n3. Contact EVSU IT Office if you can't access email\n4. Bring valid ID for verification\n\nEVSU IT Office Location: Main Building, 2nd Floor"
      }
    ]
  },

  // Academic Support
  academic: {
    keywords: ['study', 'exam', 'assignment', 'homework', 'research', 'thesis', 'project', 'grade', 'class', 'course', 'subject', 'teacher', 'professor'],
    responses: [
      {
        keywords: ['study', 'tips', 'how to study'],
        answer: "Effective study tips:\n1. Create a study schedule\n2. Find a quiet study space\n3. Take regular breaks (Pomodoro technique)\n4. Summarize notes in your own words\n5. Practice with past exams\n6. Form study groups\n7. Stay organized\n8. Get enough sleep\n\nEVSU Library hours: Mon-Fri 8AM-5PM"
      },
      {
        keywords: ['thesis', 'research', 'paper'],
        answer: "Thesis/Research guidance:\n1. Choose a relevant topic\n2. Review existing literature\n3. Consult with your adviser regularly\n4. Follow EVSU thesis format guidelines\n5. Use proper citations (APA/MLA)\n6. Keep backups of your work\n\nEVSU Library offers research assistance and access to online databases."
      },
      {
        keywords: ['time', 'management', 'schedule'],
        answer: "Time management for students:\n1. Use a planner or calendar app\n2. Prioritize tasks (urgent vs important)\n3. Break large tasks into smaller ones\n4. Avoid procrastination\n5. Set realistic goals\n6. Balance study and rest\n7. Learn to say no to distractions"
      }
    ]
  },

  // EVSU Information
  evsu: {
    keywords: ['evsu', 'campus', 'office', 'building', 'location', 'schedule', 'enrollment', 'registrar', 'admission'],
    responses: [
      {
        keywords: ['location', 'where', 'office', 'building'],
        answer: "EVSU Main Campus Offices:\n\n📍 Registrar: Admin Building, Ground Floor\n📍 Cashier: Admin Building, Ground Floor\n📍 Library: Library Building (beside gym)\n📍 IT Office: Main Building, 2nd Floor\n📍 Student Affairs: Admin Building, 2nd Floor\n📍 Guidance: Admin Building, 2nd Floor\n\nMain Campus: Tacloban City, Leyte"
      },
      {
        keywords: ['hours', 'time', 'schedule', 'open'],
        answer: "EVSU Office Hours:\n\n🕐 Regular Hours: 8:00 AM - 5:00 PM\n📅 Days: Monday to Friday\n🚫 Closed: Weekends and Holidays\n\nLibrary: 8:00 AM - 5:00 PM\nCashier: 8:00 AM - 3:00 PM (payments)\n\nNote: Hours may vary during enrollment period."
      },
      {
        keywords: ['enrollment', 'enroll', 'registration'],
        answer: "Enrollment Process:\n1. Check enrollment schedule\n2. Complete pre-registration online\n3. Consult with adviser\n4. Pay tuition fees\n5. Get validated class schedule\n6. Attend orientation\n\nRequirements:\n- Form 137 (for new students)\n- Good moral certificate\n- Birth certificate\n- 2x2 photos\n\nContact Registrar's Office for details."
      },
      {
        keywords: ['contact', 'phone', 'email'],
        answer: "EVSU Contact Information:\n\n📞 Main Line: (053) 321-8000\n📧 Email: evsu@evsu.edu.ph\n🌐 Website: www.evsu.edu.ph\n📱 Facebook: @EVSUOfficial\n\n📍 Address: Tacloban City, Leyte 6500\n\nFor specific concerns, contact the relevant office directly."
      }
    ]
  },

  // General Queries
  general: {
    keywords: ['hello', 'hi', 'help', 'thanks', 'thank you', 'bye', 'how are you'],
    responses: [
      {
        keywords: ['hello', 'hi', 'hey'],
        answer: "Hello! I'm KonsultaBot, your AI assistant. I'm currently in offline mode, but I can still help you with:\n\n• IT support and troubleshooting\n• Study tips and academic advice\n• EVSU campus information\n• General guidance\n\nWhat would you like to know?"
      },
      {
        keywords: ['help', 'assist', 'support'],
        answer: "I can help you with:\n\n💻 IT Support:\n- Computer problems\n- Network issues\n- Software help\n\n📚 Academic:\n- Study tips\n- Research guidance\n- Time management\n\n🏫 EVSU Info:\n- Office locations\n- Contact details\n- Enrollment process\n\nWhat do you need help with?"
      },
      {
        keywords: ['thank', 'thanks'],
        answer: "You're welcome! I'm here to help. Feel free to ask me anything else!\n\nNote: I'm currently in offline mode, so I have access to basic information. For more detailed assistance, please try again when you have internet connection."
      }
    ]
  }
};

// Search knowledge base for relevant answer
export const searchKnowledgeBase = (query) => {
  const lowerQuery = query.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  // Search through all categories
  Object.values(knowledgeBase).forEach(category => {
    // Check if query matches category keywords
    const categoryMatch = category.keywords.some(keyword => 
      lowerQuery.includes(keyword.toLowerCase())
    );

    if (categoryMatch) {
      // Search through responses in this category
      category.responses.forEach(response => {
        const matchCount = response.keywords.filter(keyword =>
          lowerQuery.includes(keyword.toLowerCase())
        ).length;

        if (matchCount > highestScore) {
          highestScore = matchCount;
          bestMatch = response.answer;
        }
      });
    }
  });

  // If no specific match, provide general offline response
  if (!bestMatch || highestScore === 0) {
    return {
      answer: "I'm currently in offline mode with limited information. Your question has been noted, and I'll provide a better answer when you're back online.\n\nIn the meantime, I can help with:\n• IT troubleshooting basics\n• Study tips\n• EVSU general information\n\nTry rephrasing your question or ask about these topics!",
      confidence: 0.3,
      source: 'offline_fallback'
    };
  }

  return {
    answer: bestMatch,
    confidence: Math.min(0.7 + (highestScore * 0.1), 0.95),
    source: 'knowledge_base'
  };
};

// Get random helpful tip for empty state
export const getRandomTip = () => {
  const tips = [
    "💡 Tip: Keep your files organized in folders for easy access!",
    "📚 Tip: Take breaks every 25 minutes when studying (Pomodoro technique)!",
    "🔒 Tip: Use strong passwords with numbers, letters, and symbols!",
    "☕ Tip: Stay hydrated and take care of your health while studying!",
    "📱 Tip: Turn off notifications when you need to focus!",
    "💾 Tip: Always backup your important files!",
    "🎯 Tip: Set specific, achievable goals for your study sessions!",
    "🌙 Tip: Get 7-8 hours of sleep for better academic performance!"
  ];
  
  return tips[Math.floor(Math.random() * tips.length)];
};
