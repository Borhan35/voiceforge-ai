"""
Smart Emotion Analyzer - Detects emotions from text using keyword matching and sentiment analysis.
Similar to Typecast.ai's automatic emotion recognition feature.
"""

import re
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class EmotionResult:
    """Result of emotion analysis for a piece of text."""
    emotion: str
    confidence: float
    scores: Dict[str, float]

@dataclass
class SentenceEmotionResult:
    """Emotion result for an individual sentence."""
    text: str
    emotion: str
    confidence: float

class EmotionAnalyzer:
    """
    Analyzes text to detect emotions using keyword matching and punctuation analysis.
    Supports: happy, sad, angry, excited, scared, normal
    """
    
    # Emotion keywords with weights
    EMOTION_KEYWORDS: Dict[str, Dict[str, float]] = {
        "happy": {
            "love": 1.0, "loved": 1.0, "loves": 1.0,
            "happy": 1.2, "happiness": 1.2,
            "great": 0.8, "amazing": 1.0, "wonderful": 1.0,
            "joy": 1.0, "joyful": 1.0, "delighted": 1.0,
            "pleased": 0.8, "glad": 0.8, "thankful": 0.7,
            "grateful": 0.8, "blessed": 0.8,
            "smile": 0.6, "smiling": 0.6,
            "laugh": 0.7, "laughing": 0.7,
            "cheerful": 0.9, "bright": 0.5,
            "beautiful": 0.6, "lovely": 0.7,
            "perfect": 0.8, "excellent": 0.8,
            "congratulations": 0.9, "congrats": 0.9,
            "celebrate": 0.8, "celebration": 0.8,
            "thank": 0.6, "thanks": 0.6,
        },
        "sad": {
            "sad": 1.2, "sadness": 1.2,
            "sorry": 0.9, "apologize": 0.7,
            "miss": 0.7, "missing": 0.7, "missed": 0.7,
            "cry": 1.0, "crying": 1.0, "cried": 1.0,
            "tear": 0.8, "tears": 0.8,
            "unfortunate": 0.9, "unfortunately": 0.8,
            "loss": 1.0, "lost": 0.8, "lose": 0.7,
            "regret": 0.9, "regretful": 0.9,
            "depressed": 1.2, "depression": 1.2,
            "heartbroken": 1.2, "heartbreak": 1.2,
            "lonely": 1.0, "alone": 0.6,
            "grief": 1.2, "grieve": 1.1, "grieving": 1.1,
            "mourn": 1.1, "mourning": 1.1,
            "disappointed": 0.9, "disappointment": 0.9,
            "unhappy": 1.0, "miserable": 1.1,
            "painful": 0.8, "pain": 0.6,
            "goodbye": 0.7, "farewell": 0.8,
        },
        "angry": {
            "angry": 1.2, "anger": 1.2,
            "hate": 1.2, "hated": 1.2, "hates": 1.2,
            "furious": 1.3, "fury": 1.2,
            "annoyed": 0.9, "annoying": 0.8,
            "terrible": 0.9, "horrible": 0.9,
            "worst": 1.0, "bad": 0.5,
            "frustrated": 1.0, "frustrating": 0.9, "frustration": 1.0,
            "mad": 0.9,
            "outrage": 1.2, "outraged": 1.2, "outrageous": 1.1,
            "disgusted": 1.0, "disgusting": 1.0,
            "stupid": 0.8, "idiot": 0.9,
            "damn": 0.8, "hell": 0.6,
            "ridiculous": 0.8, "absurd": 0.7,
            "unacceptable": 1.0, "intolerable": 1.0,
        },
        "excited": {
            "excited": 1.3, "exciting": 1.2, "excitement": 1.2,
            "wow": 1.0, "whoa": 0.9,
            "incredible": 1.0, "unbelievable": 0.9,
            "awesome": 1.0, "fantastic": 1.0,
            "can't wait": 1.2, "cannot wait": 1.2,
            "thrilled": 1.2, "thrilling": 1.1,
            "eager": 0.9, "eagerly": 0.9,
            "anticipate": 0.8, "anticipation": 0.8,
            "pumped": 1.0, "hyped": 1.0,
            "stoked": 1.0,
            "omg": 0.9, "oh my god": 1.0,
            "yes!": 0.8, "yay": 0.9, "woohoo": 1.0,
            "finally": 0.7,
        },
        "scared": {
            "scared": 1.2, "scary": 1.0,
            "afraid": 1.2, "fear": 1.1, "fearful": 1.1,
            "danger": 1.0, "dangerous": 0.9,
            "worried": 0.9, "worry": 0.8, "worrying": 0.8,
            "nervous": 0.9, "anxious": 1.0, "anxiety": 1.0,
            "terrified": 1.3, "terrifying": 1.2, "terror": 1.2,
            "horror": 1.1, "horrified": 1.2, "horrifying": 1.1,
            "frightened": 1.2, "frightening": 1.1,
            "panic": 1.1, "panicking": 1.1,
            "creepy": 0.8, "creep": 0.7,
            "nightmare": 1.0,
            "threat": 0.8, "threatening": 0.9,
            "helpless": 0.9, "desperate": 0.8,
        }
    }
    
    # Punctuation patterns that influence emotion
    PUNCTUATION_PATTERNS = {
        r'!{2,}': {"excited": 0.3, "angry": 0.2, "happy": 0.1},  # Multiple exclamation
        r'!': {"excited": 0.15, "happy": 0.1},  # Single exclamation
        r'\?{2,}': {"scared": 0.2, "angry": 0.15},  # Multiple question marks
        r'\.{3,}': {"sad": 0.15, "scared": 0.1},  # Ellipsis
        r'[A-Z]{3,}': {"angry": 0.2, "excited": 0.2},  # ALL CAPS words
    }
    
    # Emotion emoji patterns
    EMOJI_PATTERNS = {
        r'[:;]-?\)': {"happy": 0.3},  # :) ;)
        r'[:;]-?D': {"happy": 0.4, "excited": 0.2},  # :D ;D
        r'[:;]-?\(': {"sad": 0.4},  # :( ;(
        r'>:-?\(': {"angry": 0.4},  # >:(
        r'D:': {"scared": 0.3, "sad": 0.2},  # D:
        r'😊|😃|😄|😁|🙂': {"happy": 0.4},
        r'😢|😭|😞|😔': {"sad": 0.4},
        r'😠|😡|🤬': {"angry": 0.4},
        r'😱|😨|😰': {"scared": 0.4},
        r'🎉|🔥|🚀|✨': {"excited": 0.3},
    }

    def __init__(self):
        """Initialize the emotion analyzer."""
        self.supported_emotions = ["happy", "sad", "angry", "excited", "scared", "normal"]
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization - lowercase and split by non-alphanumeric."""
        text_lower = text.lower()
        # Keep some punctuation for pattern matching
        words = re.findall(r"[a-z']+", text_lower)
        return words
    
    def _calculate_keyword_scores(self, text: str) -> Dict[str, float]:
        """Calculate emotion scores based on keyword matching."""
        words = self._tokenize(text)
        text_lower = text.lower()
        
        scores: Dict[str, float] = {emotion: 0.0 for emotion in self.EMOTION_KEYWORDS.keys()}
        
        # Single word matching
        for word in words:
            for emotion, keywords in self.EMOTION_KEYWORDS.items():
                if word in keywords:
                    scores[emotion] += keywords[word]
        
        # Multi-word phrase matching
        for emotion, keywords in self.EMOTION_KEYWORDS.items():
            for keyword, weight in keywords.items():
                if ' ' in keyword and keyword in text_lower:
                    scores[emotion] += weight
        
        return scores
    
    def _calculate_punctuation_scores(self, text: str) -> Dict[str, float]:
        """Calculate emotion adjustments based on punctuation patterns."""
        scores: Dict[str, float] = {emotion: 0.0 for emotion in self.EMOTION_KEYWORDS.keys()}
        
        for pattern, emotions in self.PUNCTUATION_PATTERNS.items():
            matches = len(re.findall(pattern, text))
            if matches > 0:
                for emotion, weight in emotions.items():
                    scores[emotion] += weight * min(matches, 3)  # Cap at 3 matches
        
        return scores
    
    def _calculate_emoji_scores(self, text: str) -> Dict[str, float]:
        """Calculate emotion scores based on emoji/emoticon patterns."""
        scores: Dict[str, float] = {emotion: 0.0 for emotion in self.EMOTION_KEYWORDS.keys()}
        
        for pattern, emotions in self.EMOJI_PATTERNS.items():
            if re.search(pattern, text):
                for emotion, weight in emotions.items():
                    scores[emotion] += weight
        
        return scores
    
    def analyze(self, text: str) -> EmotionResult:
        """
        Analyze text and return the detected emotion with confidence score.
        
        Args:
            text: The input text to analyze
            
        Returns:
            EmotionResult with detected emotion, confidence, and all scores
        """
        if not text or not text.strip():
            return EmotionResult(emotion="normal", confidence=1.0, scores={})
        
        # Calculate scores from different sources
        keyword_scores = self._calculate_keyword_scores(text)
        punctuation_scores = self._calculate_punctuation_scores(text)
        emoji_scores = self._calculate_emoji_scores(text)
        
        # Combine scores
        combined_scores: Dict[str, float] = {}
        for emotion in self.EMOTION_KEYWORDS.keys():
            combined_scores[emotion] = (
                keyword_scores.get(emotion, 0) * 1.0 +  # Keywords are primary
                punctuation_scores.get(emotion, 0) * 0.5 +  # Punctuation is secondary
                emoji_scores.get(emotion, 0) * 0.7  # Emoji is strong indicator
            )
        
        # Find the dominant emotion
        max_score = max(combined_scores.values())
        
        if max_score < 0.5:
            # No strong emotion detected
            return EmotionResult(
                emotion="normal",
                confidence=1.0 - (max_score / 0.5) * 0.3,  # Reduce confidence if there's some signal
                scores=combined_scores
            )
        
        # Get the emotion with highest score
        detected_emotion = max(combined_scores, key=combined_scores.get)
        
        # Calculate confidence (relative strength of the top emotion)
        total_score = sum(combined_scores.values())
        confidence = (max_score / total_score) if total_score > 0 else 0.5
        
        # Boost confidence if score is very high
        if max_score > 2.0:
            confidence = min(confidence * 1.2, 0.98)
        
        return EmotionResult(
            emotion=detected_emotion,
            confidence=round(confidence, 2),
            scores={k: round(v, 2) for k, v in combined_scores.items()}
        )
    
    def analyze_sentences(self, text: str) -> List[SentenceEmotionResult]:
        """
        Analyze text sentence by sentence and return emotion for each.
        
        Args:
            text: The input text to analyze
            
        Returns:
            List of SentenceEmotionResult for each sentence
        """
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        
        results = []
        for sentence in sentences:
            if sentence.strip():
                result = self.analyze(sentence)
                results.append(SentenceEmotionResult(
                    text=sentence,
                    emotion=result.emotion,
                    confidence=result.confidence
                ))
        
        return results
    
    def get_dominant_emotion(self, text: str) -> Tuple[str, float]:
        """
        Simple helper to get just the emotion and confidence.
        
        Args:
            text: The input text to analyze
            
        Returns:
            Tuple of (emotion_name, confidence_score)
        """
        result = self.analyze(text)
        return result.emotion, result.confidence


# Singleton instance for easy import
emotion_analyzer = EmotionAnalyzer()


def analyze_emotion(text: str) -> Dict:
    """
    Convenience function for analyzing emotion.
    
    Args:
        text: Text to analyze
        
    Returns:
        Dictionary with 'emotion', 'confidence', and 'scores'
    """
    result = emotion_analyzer.analyze(text)
    return {
        "detected_emotion": result.emotion,
        "confidence": result.confidence,
        "scores": result.scores
    }


def analyze_sentences(text: str) -> List[Dict]:
    """
    Convenience function for analyzing sentences.
    
    Args:
        text: Text to analyze
        
    Returns:
        List of dictionaries with sentence analysis results
    """
    results = emotion_analyzer.analyze_sentences(text)
    return [
        {
            "text": r.text,
            "emotion": r.emotion,
            "confidence": r.confidence
        }
        for r in results
    ]
