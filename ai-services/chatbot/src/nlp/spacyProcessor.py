#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
spaCy processor for Spanish text processing
Handles tokenization, NER, POS tagging, and dependency parsing
"""

import spacy
import json
import sys
from typing import Dict, List, Any

class SpacyProcessor:
    def __init__(self):
        try:
            # Load Spanish model
            self.nlp = spacy.load("es_core_news_sm")
        except OSError:
            print("Error: Spanish spaCy model not found. Please install with: python -m spacy download es_core_news_sm")
            sys.exit(1)
    
    def process_text(self, text: str) -> Dict[str, Any]:
        """
        Process text and extract linguistic features
        """
        doc = self.nlp(text)
        
        result = {
            "tokens": [],
            "entities": [],
            "pos_tags": [],
            "dependencies": [],
            "lemmas": [],
            "sentiment": self._analyze_sentiment(doc),
            "keywords": self._extract_keywords(doc)
        }
        
        for token in doc:
            result["tokens"].append({
                "text": token.text,
                "lemma": token.lemma_,
                "pos": token.pos_,
                "tag": token.tag_,
                "is_alpha": token.is_alpha,
                "is_stop": token.is_stop,
                "is_punct": token.is_punct
            })
            
            result["lemmas"].append(token.lemma_.lower())
            
            result["pos_tags"].append({
                "text": token.text,
                "pos": token.pos_,
                "tag": token.tag_
            })
            
            if token.dep_ != "ROOT":
                result["dependencies"].append({
                    "text": token.text,
                    "dep": token.dep_,
                    "head": token.head.text
                })
        
        for ent in doc.ents:
            result["entities"].append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char
            })
        
        return result
    
    def _analyze_sentiment(self, doc) -> str:
        """
        Basic sentiment analysis based on linguistic patterns
        """
        positive_words = ["bueno", "excelente", "genial", "perfecto", "increíble", "fantástico"]
        negative_words = ["malo", "terrible", "horrible", "pésimo", "deficiente"]
        
        text_lower = doc.text.lower()
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def _extract_keywords(self, doc) -> List[str]:
        """
        Extract important keywords from text
        """
        keywords = []
        
        for token in doc:
            # Include nouns, adjectives, and proper nouns that are not stop words
            if (token.pos_ in ["NOUN", "ADJ", "PROPN"] and 
                not token.is_stop and 
                not token.is_punct and 
                len(token.text) > 2):
                keywords.append(token.lemma_.lower())
        
        return list(set(keywords))  # Remove duplicates

def main():
    """
    Main function to process text from command line arguments
    """
    if len(sys.argv) != 2:
        print("Usage: python spacyProcessor.py '<text>'")
        sys.exit(1)
    
    text = sys.argv[1]
    processor = SpacyProcessor()
    result = processor.process_text(text)
    
    # Output JSON result
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()