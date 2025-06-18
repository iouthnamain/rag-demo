export interface UserPreferences {
  name: string;
  occupation: string;
  traits: string[];
  additionalInfo: string;
}

export interface TraitDefinition {
  id: string;
  label: string;
  icon: string;
  description: string;
}

/**
 * User Preferences Service
 * Manages user customization settings and integrates them with chat responses
 */
export class UserPreferencesService {
  private static instance: UserPreferencesService;
  private preferences: UserPreferences | null = null;

  // Trait definitions with descriptions for FPT School counseling context
  private readonly traitDefinitions: Record<string, TraitDefinition> = {
    friendly: {
      id: 'friendly',
      label: 'thân thiện',
      icon: '😊',
      description: 'warm, approachable, and creating a comfortable counseling environment'
    },
    professional: {
      id: 'professional',
      label: 'chuyên nghiệp',
      icon: '💼',
      description: 'formal, structured, providing clear academic and career guidance'
    },
    concise: {
      id: 'concise',
      label: 'súc tích',
      icon: '📝',
      description: 'brief, to-the-point, giving clear answers without overwhelming details'
    },
    detailed: {
      id: 'detailed',
      label: 'chi tiết',
      icon: '🔍',
      description: 'thorough explanations of programs, career paths, and study requirements'
    },
    empathetic: {
      id: 'empathetic',
      label: 'đồng cảm',
      icon: '💝',
      description: 'understanding student concerns, fears, and family expectations about education'
    },
    encouraging: {
      id: 'encouraging',
      label: 'động viên',
      icon: '🌟',
      description: 'motivational, building confidence in students about their potential'
    },
    patient: {
      id: 'patient',
      label: 'kiên nhẫn',
      icon: '⏳',
      description: 'calm, taking time to explain concepts and answer all questions thoroughly'
    },
    practical: {
      id: 'practical',
      label: 'thực tế',
      icon: '🎯',
      description: 'focused on real-world applications, job market insights, and practical advice'
    },
    analytical: {
      id: 'analytical',
      label: 'phân tích',
      icon: '📊',
      description: 'data-driven approach to career guidance, using market trends and statistics'
    },
    inspiring: {
      id: 'inspiring',
      label: 'truyền cảm hứng',
      icon: '✨',
      description: 'motivating students to pursue their dreams in technology and innovation'
    }
  };

  private constructor() {
    this.loadPreferences();
  }

  /**
   * Get singleton instance of UserPreferencesService
   */
  public static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  /**
   * Load preferences from localStorage
   */
  public loadPreferences(): UserPreferences | null {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('chatbot-preferences');
        if (saved) {
          this.preferences = JSON.parse(saved) as UserPreferences;
          return this.preferences;
        }
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
    return null;
  }

  /**
   * Save preferences to localStorage
   */
  public savePreferences(preferences: UserPreferences): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatbot-preferences', JSON.stringify(preferences));
        this.preferences = preferences;
      }
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  /**
   * Get current preferences
   */
  public getPreferences(): UserPreferences | null {
    if (!this.preferences) {
      return this.loadPreferences();
    }
    return this.preferences;
  }

  /**
   * Build personalized context for AI prompts
   */
  public buildPersonalizedContext(): string {
    const prefs = this.getPreferences();
    if (!prefs) return '';

    let context = '';

    // Add user name
    if (prefs.name) {
      context += `Người dùng tên: ${prefs.name}\n`;
    }

    // Add occupation
    if (prefs.occupation) {
      context += `Nghề nghiệp: ${prefs.occupation}\n`;
    }

    // Add personality traits
    if (prefs.traits.length > 0) {
      const traitDescriptions = prefs.traits
        .map(traitId => {
          const trait = this.traitDefinitions[traitId];
          return trait ? trait.description : traitId;
        })
        .join(', ');
      
      context += `Phong cách trả lời mong muốn: ${traitDescriptions}\n`;
    }

    // Add additional info
    if (prefs.additionalInfo) {
      context += `Thông tin bổ sung: ${prefs.additionalInfo}\n`;
    }

    return context;
  }

  /**
   * Build personalized greeting for FPT School context
   */
  public buildPersonalizedGreeting(): string {
    const prefs = this.getPreferences();
    if (!prefs) return 'Xin chào! Tôi là trợ lý tư vấn tuyển sinh của FPT School. Tôi có thể giúp bạn tìm hiểu về các ngành học và định hướng nghề nghiệp phù hợp!';

    let greeting = 'Xin chào';
    
    if (prefs.name) {
      greeting += ` ${prefs.name}`;
    }

    greeting += '! ';

    // Add context-specific greeting based on user info
    if (prefs.occupation) {
      if (prefs.occupation.toLowerCase().includes('học sinh') || prefs.occupation.toLowerCase().includes('student')) {
        greeting += 'Tôi thấy bạn đang là học sinh. ';
      } else if (prefs.occupation.toLowerCase().includes('phụ huynh') || prefs.occupation.toLowerCase().includes('parent')) {
        greeting += 'Tôi hiểu bạn đang quan tâm đến việc định hướng cho con em mình. ';
      } else {
        greeting += `Với kinh nghiệm ${prefs.occupation.toLowerCase()}, `;
      }
    }

    greeting += 'Tôi là trợ lý tư vấn tuyển sinh của **FPT School** và sẽ giúp bạn tìm hiểu về các ngành học công nghệ, cơ hội nghề nghiệp và lộ trình phát triển sự nghiệp. Bạn muốn khám phá điều gì hôm nay?';

    return greeting;
  }

  /**
   * Get personality instruction for AI
   */
  public getPersonalityInstruction(): string {
    const prefs = this.getPreferences();
    if (!prefs || prefs.traits.length === 0) {
      return 'Hãy trả lời một cách thân thiện và hữu ích.';
    }

    const traitLabels = prefs.traits
      .map(traitId => {
        const trait = this.traitDefinitions[traitId];
        return trait ? trait.label : traitId;
      })
      .join(', ');

    return `Hãy trả lời theo phong cách: ${traitLabels}. Thể hiện những đặc điểm này trong cách giao tiếp của bạn.`;
  }

  /**
   * Check if user has set preferences
   */
  public hasPreferences(): boolean {
    const prefs = this.getPreferences();
    return !!(prefs && (prefs.name || prefs.occupation || prefs.traits.length > 0 || prefs.additionalInfo));
  }

  /**
   * Get trait definitions
   */
  public getTraitDefinitions(): Record<string, TraitDefinition> {
    return this.traitDefinitions;
  }

  /**
   * Get available traits as array
   */
  public getAvailableTraits(): TraitDefinition[] {
    return Object.values(this.traitDefinitions);
  }

  /**
   * Clear all preferences
   */
  public clearPreferences(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('chatbot-preferences');
        this.preferences = null;
      }
    } catch (error) {
      console.error('Error clearing user preferences:', error);
    }
  }

  /**
   * Get user-specific conversation context for FPT School counseling
   */
  public getUserContext(): string {
    const prefs = this.getPreferences();
    if (!prefs) return '';

    let context = '\nTHÔNG TIN HỌC VIÊN CẦN TƯ VẤN:\n';
    
    if (prefs.name) {
      context += `- Tên: ${prefs.name}\n`;
    }
    
    if (prefs.occupation) {
      context += `- Hiện tại: ${prefs.occupation}\n`;
    }
    
    if (prefs.traits.length > 0) {
      const traits = prefs.traits
        .map(id => this.traitDefinitions[id]?.label || id)
        .join(', ');
      context += `- Phong cách tư vấn mong muốn: ${traits}\n`;
    }
    
    if (prefs.additionalInfo) {
      context += `- Thông tin bổ sung: ${prefs.additionalInfo}\n`;
    }

    context += '\nHướng dẫn: Dựa trên thông tin trên để tư vấn phù hợp về các ngành học tại FPT School và định hướng nghề nghiệp công nghệ.\n';

    return context;
  }
} 