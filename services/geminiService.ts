import { supabase } from './supabaseClient';

export const generateText = async (prompt: string, model: string = 'gemini-3-flash-preview') => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: { action: 'gemini_generate', prompt, model }
    });
    if (error) throw new Error('Failed to generate content');
    return data.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const translateToPortuguese = async (text: string): Promise<string> => {
  if (!text || text.trim().length === 0) return text;

  try {
    const { data: edgeData, error } = await supabase.functions.invoke('gemini-proxy', {
      body: { action: 'gemini_translate', text }
    });
    if (error) return text;
    const data = edgeData;
    return data.text || text;
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    return text;
  }
};

export const fetchEntertainmentInfo = async (title: string, type: string) => {
  try {
    const { data: edgeData, error } = await supabase.functions.invoke('gemini-proxy', {
      body: { action: 'gemini_entertainment_info', title, type }
    });
    if (error) return null;
    return edgeData;
  } catch (error) {
    console.error("Gemini Auto-fill Error:", error);
    return null;
  }
};
