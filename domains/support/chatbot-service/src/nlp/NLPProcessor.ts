import { PythonShell } from 'python-shell';
import path from 'path';

export interface Token {
  text: string;
  lemma: string;
  pos: string;
  tag: string;
  is_alpha: boolean;
  is_stop: boolean;
  is_punct: boolean;
}

export interface Entity {
  text: string;
  label: string;
  start: number;
  end: number;
}

export interface POSTag {
  text: string;
  pos: string;
  tag: string;
}

export interface Dependency {
  text: string;
  dep: string;
  head: string;
}

export interface NLPResult {
  tokens: Token[];
  entities: Entity[];
  pos_tags: POSTag[];
  dependencies: Dependency[];
  lemmas: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
}

export class NLPProcessor {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'spacyProcessor.py');
  }

  /**
   * Process text using spaCy for Spanish NLP
   */
  async processText(text: string): Promise<NLPResult> {
    try {
      const options = {
        mode: 'text' as const,
        pythonPath: 'python',
        pythonOptions: ['-u'],
        scriptPath: path.dirname(this.pythonScriptPath),
        args: [text]
      };

      const results = await PythonShell.run('spacyProcessor.py', options);
      const result = JSON.parse(results.join('')) as NLPResult;
      
      return result;
    } catch (error) {
      console.error('Error processing text with spaCy:', error);
      throw new Error('Failed to process text with NLP engine');
    }
  }

  /**
   * Extract entities from text
   */
  async extractEntities(text: string): Promise<Entity[]> {
    const result = await this.processText(text);
    return result.entities;
  }

  /**
   * Get keywords from text
   */
  async extractKeywords(text: string): Promise<string[]> {
    const result = await this.processText(text);
    return result.keywords;
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    const result = await this.processText(text);
    return result.sentiment;
  }

  /**
   * Get lemmatized tokens
   */
  async getLemmas(text: string): Promise<string[]> {
    const result = await this.processText(text);
    return result.lemmas;
  }
}