import { BaseLanguageModel } from "langchain/dist/base_language";
import { BaseOutputParser } from "langchain/dist/schema/output_parser";

export interface GrokXAIConfig {
  model: BaseLanguageModel;
  outputParser?: BaseOutputParser;
  explanationPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export class GrokXAIAdapter {
  private model: BaseLanguageModel;
  private outputParser?: BaseOutputParser;
  private explanationPrompt: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: GrokXAIConfig) {
    this.model = config.model;
    this.outputParser = config.outputParser;
    this.explanationPrompt =
      config.explanationPrompt ||
      "Using Grok-style analysis, explain the reasoning behind this:";
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.7;
  }

  async explain(input: string): Promise<string> {
    const prompt = `${this.explanationPrompt}\n${input}\n\nExplanation in Grok style:`;
    const response = await this.model.call(prompt);

    if (this.outputParser) {
      return this.outputParser.parse(response);
    }

    return response;
  }

  async getFeatureImportance(input: string): Promise<Record<string, number>> {
    const prompt = `Analyze the following and return feature importance scores (0-1) for each key component:\n${input}`;
    const response = await this.model.call(prompt);

    try {
      // Parse the response into a feature importance map
      const importanceMap: Record<string, number> = {};
      const lines = response.split("\n");

      for (const line of lines) {
        const [feature, score] = line.split(":").map((s) => s.trim());
        if (feature && score) {
          importanceMap[feature] = parseFloat(score);
        }
      }

      return importanceMap;
    } catch (error) {
      console.error("Error parsing feature importance:", error);
      return {};
    }
  }

  async getCounterfactuals(
    input: string,
    numExamples: number = 3
  ): Promise<string[]> {
    const prompt = `Generate ${numExamples} alternative scenarios that would lead to different outcomes:\n${input}`;
    const response = await this.model.call(prompt);

    try {
      return response
        .split("\n")
        .filter((line) => line.trim())
        .slice(0, numExamples);
    } catch (error) {
      console.error("Error generating counterfactuals:", error);
      return [];
    }
  }

  async analyzeSentiment(input: string): Promise<{
    sentiment: "positive" | "negative" | "neutral";
    confidence: number;
    explanation: string;
  }> {
    const prompt = `Analyze the sentiment of the following text and explain why:\n${input}`;
    const response = await this.model.call(prompt);

    // This is a simplified implementation
    return {
      sentiment: "neutral",
      confidence: 0.5,
      explanation: response,
    };
  }
}
