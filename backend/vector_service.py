"""Qdrant vector database service for semantic search"""
from typing import List, Optional, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer
from config import settings
import uuid

class VectorService:
    def __init__(self):
        self.collection_name = settings.QDRANT_COLLECTION
        self.embedding_model_name = "all-MiniLM-L6-v2"  # 384 dimensions
        self.embedding_dim = 384

        try:
            # Initialize Qdrant client
            self.client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
                timeout=10
            )

            # Initialize embedding model
            print(f"Loading embedding model: {self.embedding_model_name}...")
            self.embedding_model = SentenceTransformer(self.embedding_model_name)

            # Create collection if it doesn't exist
            self._ensure_collection()

            print(f"✓ Qdrant connected: {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
        except Exception as e:
            print(f"⚠ Qdrant initialization failed: {e}")
            self.client = None
            self.embedding_model = None

    def _ensure_collection(self):
        """Create collection if it doesn't exist"""
        if not self.client:
            return

        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)

            if not exists:
                print(f"Creating Qdrant collection: {self.collection_name}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dim,
                        distance=Distance.COSINE
                    )
                )
                print(f"✓ Collection '{self.collection_name}' created")
            else:
                print(f"✓ Collection '{self.collection_name}' already exists")
        except Exception as e:
            print(f"Error ensuring collection: {e}")

    def embed_text(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text"""
        if not self.embedding_model:
            return None

        try:
            embedding = self.embedding_model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            print(f"Embedding error: {e}")
            return None

    def add_case(
        self,
        case_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Add a case to the vector database"""
        if not self.client:
            return False

        try:
            embedding = self.embed_text(text)
            if not embedding:
                return False

            point = PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "case_id": case_id,
                    "text": text,
                    **(metadata or {})
                }
            )

            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            return True
        except Exception as e:
            print(f"Error adding case to Qdrant: {e}")
            return False

    def search_similar_cases(
        self,
        query: str,
        limit: int = 5,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar cases based on query"""
        if not self.client:
            return []

        try:
            # Generate query embedding
            query_embedding = self.embed_text(query)
            if not query_embedding:
                return []

            # Build filter if category specified
            query_filter = None
            if category:
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key="category",
                            match=MatchValue(value=category)
                        )
                    ]
                )

            # Search
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=limit,
                query_filter=query_filter
            )

            # Format results
            similar_cases = []
            for result in results:
                similar_cases.append({
                    "score": result.score,
                    "case_id": result.payload.get("case_id"),
                    "text": result.payload.get("text"),
                    "category": result.payload.get("category"),
                    "metadata": {k: v for k, v in result.payload.items()
                               if k not in ["case_id", "text", "category"]}
                })

            return similar_cases
        except Exception as e:
            print(f"Error searching Qdrant: {e}")
            return []

    def clear_collection(self):
        """Clear all vectors from collection"""
        if not self.client:
            return

        try:
            self.client.delete_collection(collection_name=self.collection_name)
            self._ensure_collection()
            print(f"✓ Collection '{self.collection_name}' cleared")
        except Exception as e:
            print(f"Error clearing collection: {e}")

# Global vector service instance
vector_service = VectorService()
