"""
LLM Service with automatic fallback support for medical radiology reports

Supports multiple LLM providers with automatic failover:
- Google Gemini (primary)
- OpenAI GPT-4 (fallback 1)
- Anthropic Claude (fallback 2)
"""
import os
import time
from typing import Optional, Dict, List
from enum import Enum

import google.generativeai as genai
from openai import OpenAI
from anthropic import Anthropic

from config import settings


class LLMProvider(str, Enum):
    GEMINI = "gemini"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


class LLMService:
    """Unified LLM service with automatic fallback"""

    def __init__(self):
        """Initialize LLM service with all available providers"""
        self.providers = self._get_fallback_order()
        self.max_retries = settings.LLM_MAX_RETRIES

        # Initialize clients
        self._init_gemini()
        self._init_openai()
        self._init_anthropic()

        print(f"✓ LLM Service initialized with fallback order: {' -> '.join(self.providers)}")

    def _get_fallback_order(self) -> List[str]:
        """Get the fallback order from configuration"""
        order = [p.strip() for p in settings.LLM_FALLBACK_ORDER.split(",")]
        # Filter out providers without API keys
        available = []
        for provider in order:
            if provider == "gemini" and settings.GEMINI_API_KEY:
                available.append(provider)
            elif provider == "openai" and settings.OPENAI_API_KEY:
                available.append(provider)
            elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
                available.append(provider)

        if not available:
            print("⚠️ Warning: No LLM providers configured!")
            return []

        return available

    def _init_gemini(self):
        """Initialize Google Gemini"""
        if settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.gemini_model = settings.GEMINI_MODEL
                print(f"✓ Gemini initialized ({self.gemini_model})")
            except Exception as e:
                print(f"✗ Gemini initialization failed: {e}")
                self.gemini_model = None
        else:
            self.gemini_model = None

    def _init_openai(self):
        """Initialize OpenAI"""
        if settings.OPENAI_API_KEY:
            try:
                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                self.openai_model = settings.OPENAI_MODEL
                print(f"✓ OpenAI initialized ({self.openai_model})")
            except Exception as e:
                print(f"✗ OpenAI initialization failed: {e}")
                self.openai_client = None
        else:
            self.openai_client = None

    def _init_anthropic(self):
        """Initialize Anthropic Claude"""
        if settings.ANTHROPIC_API_KEY:
            try:
                self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                self.anthropic_model = settings.ANTHROPIC_MODEL
                print(f"✓ Anthropic initialized ({self.anthropic_model})")
            except Exception as e:
                print(f"✗ Anthropic initialization failed: {e}")
                self.anthropic_client = None
        else:
            self.anthropic_client = None

    def generate_content(self, system_instruction: str, user_prompt: str) -> str:
        """
        Generate content using the first available LLM with fallback

        Args:
            system_instruction: System-level instructions for the LLM
            user_prompt: User's prompt/request

        Returns:
            Generated text response

        Raises:
            Exception: If all providers fail
        """
        errors = []

        for provider in self.providers:
            try:
                print(f"🔄 Attempting generation with {provider.upper()}...")

                if provider == "gemini":
                    response = self._generate_with_gemini(system_instruction, user_prompt)
                elif provider == "openai":
                    response = self._generate_with_openai(system_instruction, user_prompt)
                elif provider == "anthropic":
                    response = self._generate_with_anthropic(system_instruction, user_prompt)
                else:
                    continue

                print(f"✓ Successfully generated with {provider.upper()}")
                return response

            except Exception as e:
                error_msg = str(e)
                print(f"✗ {provider.upper()} failed: {error_msg}")
                errors.append(f"{provider}: {error_msg}")

                # Check if it's a quota/rate limit error
                if any(keyword in error_msg.lower() for keyword in ['quota', 'rate limit', 'exceeded', '429']):
                    print(f"  → Quota exceeded for {provider}, trying next provider...")
                    continue
                else:
                    # For other errors, might want to retry the same provider
                    print(f"  → Non-quota error for {provider}, trying next provider...")
                    continue

        # All providers failed
        error_summary = "\n".join(errors)
        raise Exception(
            f"All LLM providers failed after {len(self.providers)} attempts:\n{error_summary}"
        )

    def _generate_with_gemini(self, system_instruction: str, user_prompt: str) -> str:
        """Generate using Google Gemini"""
        if not self.gemini_model:
            raise Exception("Gemini not initialized")

        model = genai.GenerativeModel(
            model_name=self.gemini_model,
            system_instruction=system_instruction
        )
        response = model.generate_content(user_prompt)
        return response.text.strip()

    def _generate_with_openai(self, system_instruction: str, user_prompt: str) -> str:
        """Generate using OpenAI GPT-4"""
        if not self.openai_client:
            raise Exception("OpenAI not initialized")

        response = self.openai_client.chat.completions.create(
            model=self.openai_model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        return response.choices[0].message.content.strip()

    def _generate_with_anthropic(self, system_instruction: str, user_prompt: str) -> str:
        """Generate using Anthropic Claude"""
        if not self.anthropic_client:
            raise Exception("Anthropic not initialized")

        response = self.anthropic_client.messages.create(
            model=self.anthropic_model,
            max_tokens=4000,
            system=system_instruction,
            messages=[
                {"role": "user", "content": user_prompt}
            ]
        )
        return response.content[0].text.strip()


# Singleton instance
llm_service = LLMService()
