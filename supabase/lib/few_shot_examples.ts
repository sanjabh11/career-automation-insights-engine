// supabase/lib/few_shot_examples.ts

export const FEW_SHOT_EXAMPLES = [
    {
        occupation: "Data Entry Keyer",
        category: "High Automation",
        example: {
            overall_apo: 85,
            items: [
                {
                    category: "tasks",
                    description: "Enter data from source documents into computer database",
                    factors: ["routine", "data_driven"],
                    explanation: "Highly repetitive, rule-based task easily handled by OCR and RPA.",
                    confidence: 0.95,
                    metadata: { importance: 0.9, frequency: "high", skill_level: 2, tech_adoption: 0.9 }
                },
                {
                    category: "skills",
                    description: "Typing speed and accuracy",
                    factors: ["routine"],
                    explanation: "Mechanical skill, easily replicable by automated input systems.",
                    confidence: 0.9,
                    metadata: { importance: 0.8, frequency: "high", skill_level: 2, tech_adoption: 0.8 }
                }
            ],
            category_apos: {
                tasks: { apo: 90, confidence: "high" },
                knowledge: { apo: 70, confidence: "medium" },
                skills: { apo: 85, confidence: "high" },
                abilities: { apo: 60, confidence: "medium" },
                technologies: { apo: 95, confidence: "high" }
            },
            timeline_projections: {
                immediate: 70,
                short_term: 85,
                medium_term: 95,
                long_term: 99,
                explanation: "Immediate impact from OCR; near-total automation within 5 years."
            },
            key_factors: {
                bottlenecks: ["Handwritten documents with poor legibility"],
                gen_ai_impacts: ["Automated extraction from unstructured text"],
                adaptation_strategies: ["Transition to data quality assurance"]
            },
            recommendations: ["Learn data validation tools", "Upskill to database management"],
            clarifications_needed: []
        }
    },
    {
        occupation: "Financial Analyst",
        category: "Augmentation",
        example: {
            overall_apo: 62,
            items: [
                {
                    category: "tasks",
                    description: "Analyze financial statements to identify trends",
                    factors: ["data_driven", "genai_boost", "judgment"],
                    explanation: "AI excels at pattern recognition, but interpreting context requires judgment.",
                    confidence: 0.85,
                    metadata: { importance: 0.9, frequency: "high", skill_level: 4, tech_adoption: 0.8 }
                },
                {
                    category: "knowledge",
                    description: "Economics and Accounting principles",
                    factors: ["data_driven"],
                    explanation: "Codifiable knowledge, but application requires nuance.",
                    confidence: 0.8,
                    metadata: { importance: 0.8, frequency: "medium", skill_level: 4, tech_adoption: 0.7 }
                }
            ],
            category_apos: {
                tasks: { apo: 65, confidence: "high" },
                knowledge: { apo: 55, confidence: "medium" },
                skills: { apo: 60, confidence: "medium" },
                abilities: { apo: 40, confidence: "medium" },
                technologies: { apo: 80, confidence: "high" }
            },
            timeline_projections: {
                immediate: 40,
                short_term: 60,
                medium_term: 75,
                long_term: 80,
                explanation: "Steady increase as AI tools for analysis mature; human oversight remains key."
            },
            key_factors: {
                bottlenecks: ["Regulatory compliance accountability", "Complex market sentiment analysis"],
                gen_ai_impacts: ["Automated report generation", "Real-time anomaly detection"],
                adaptation_strategies: ["Focus on strategic interpretation", "Master AI financial tools"]
            },
            recommendations: ["Learn Python for finance", "Develop strategic communication skills"],
            clarifications_needed: []
        }
    },
    {
        occupation: "Mental Health Counselor",
        category: "Low Automation",
        example: {
            overall_apo: 25,
            items: [
                {
                    category: "tasks",
                    description: "Counsel clients to assist in overcoming dependencies",
                    factors: ["social", "judgment", "creative"],
                    explanation: "Requires deep empathy, trust, and complex human interaction.",
                    confidence: 0.9,
                    metadata: { importance: 0.95, frequency: "high", skill_level: 5, tech_adoption: 0.3 }
                },
                {
                    category: "abilities",
                    description: "Oral Comprehension and Expression",
                    factors: ["social"],
                    explanation: "Nuanced understanding of emotional tone and subtext.",
                    confidence: 0.85,
                    metadata: { importance: 0.9, frequency: "high", skill_level: 4, tech_adoption: 0.2 }
                }
            ],
            category_apos: {
                tasks: { apo: 20, confidence: "high" },
                knowledge: { apo: 40, confidence: "medium" },
                skills: { apo: 30, confidence: "medium" },
                abilities: { apo: 15, confidence: "high" },
                technologies: { apo: 50, confidence: "medium" }
            },
            timeline_projections: {
                immediate: 10,
                short_term: 20,
                medium_term: 30,
                long_term: 35,
                explanation: "AI will support admin and intake, but core therapy remains human-centric."
            },
            key_factors: {
                bottlenecks: ["Need for human connection", "Ethical and legal liability"],
                gen_ai_impacts: ["AI chatbots for between-session support", "Automated note-taking"],
                adaptation_strategies: ["Integrate digital health tools", "Specialize in complex trauma"]
            },
            recommendations: ["Stay updated on tele-health regulations", "Focus on complex cases"],
            clarifications_needed: []
        }
    }
];
