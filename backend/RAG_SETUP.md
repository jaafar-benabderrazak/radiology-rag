# RAG (Retrieval-Augmented Generation) Setup

## Overview

The RAG system enhances radiology report generation by retrieving similar historical cases from a vector database and using them as context for the AI.

## Architecture

- **Vector Database**: Qdrant
- **Embedding Model**: SentenceTransformer (all-MiniLM-L6-v2, 384 dimensions)
- **Similarity Search**: Cosine similarity
- **Integration**: Automatic when using "auto" template mode

## How RAG Works

1. **User Input**: Radiologist enters clinical indication
2. **Template Selection**: System auto-selects appropriate template
3. **Similarity Search**: Qdrant searches for 3 most similar historical cases
4. **Context Enhancement**: Similar cases are added to the AI prompt
5. **Report Generation**: Gemini generates report with enriched context

## Setup Instructions

### 1. Ensure Qdrant is Running

```bash
docker-compose -f docker-compose.local.yml ps qdrant
```

Should show: `Up`

### 2. Seed the Database with Sample Cases

```bash
# Run the seed script
docker exec -it radiology-backend-local python seed_qdrant.py
```

Expected output:
```
======================================================================
Seeding Qdrant Vector Database with Sample Radiology Cases
======================================================================

Target collection: radiology_cases
Total cases to add: 30

Adding CT001 (Pulmonary Embolism)... ✓
Adding CT002 (Acute Ischemic Stroke)... ✓
...

✅ Seeding Complete!
  Successfully added: 30 cases
======================================================================

Cases by Category:
  CT: 8 cases
  IRM: 6 cases
  Ultrasound: 5 cases
  X-Ray: 7 cases
```

### 3. Verify RAG is Working

Test the endpoint:

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "input": "Patient with acute chest pain and shortness of breath",
    "templateId": "auto",
    "use_rag": true
  }'
```

Check the response - it should include a `similar_cases` array with relevant cases.

## Sample Cases Included

The seed script includes 30 realistic radiology cases:

### CT Scans (8 cases)
- Pulmonary Embolism
- Acute Ischemic Stroke
- Acute Appendicitis
- Stable Pulmonary Nodule
- Acute Subdural Hematoma
- Suspected Lung Cancer
- Subarachnoid Hemorrhage
- Aortic Dissection Type A

### MRI Scans (6 cases)
- Disc Herniation with Radiculopathy
- Alzheimer's Dementia
- Meniscal Tear
- Multiple Sclerosis
- Rotator Cuff Tear
- Brainstem Tumor

### X-Rays (7 cases)
- Pneumonia
- Colles Fracture
- COPD/Emphysema
- Small Bowel Obstruction
- Hip Fracture
- Normal Chest X-ray
- Lung Mass with Collapse

### Ultrasound (5 cases)
- Cholelithiasis (Gallstones)
- Normal Early Pregnancy
- Deep Vein Thrombosis
- Hepatic Steatosis (Fatty Liver)
- Suspicious Thyroid Nodule

## Adding More Cases

You can add your own cases to the database:

```python
from vector_service import vector_service

vector_service.add_case(
    case_id="CUSTOM001",
    text="Your detailed case description here...",
    metadata={
        "category": "CT",
        "modality": "CT Chest",
        "diagnosis": "Your diagnosis"
    }
)
```

## API Usage

### Enable RAG (Default)

```json
{
  "input": "Clinical indication...",
  "templateId": "auto",
  "use_rag": true
}
```

### Disable RAG

```json
{
  "input": "Clinical indication...",
  "templateId": "ctpa_pe",
  "use_rag": false
}
```

**Note**: RAG only activates when `templateId` is set to `"auto"` AND `use_rag` is `true`.

## Checking RAG Status

Visit the health endpoint:

```bash
curl http://localhost:8000/
```

Response includes:
```json
{
  "status": "online",
  "cache_enabled": true,
  "vector_db_enabled": true
}
```

`vector_db_enabled: true` means RAG is ready!

## Troubleshooting

### RAG not returning similar cases

1. **Check if Qdrant is running**:
   ```bash
   docker-compose -f docker-compose.local.yml logs qdrant
   ```

2. **Verify database is seeded**:
   ```bash
   docker exec -it radiology-backend-local python -c "from vector_service import vector_service; print(vector_service.client.count('radiology_cases'))"
   ```

3. **Re-seed the database**:
   ```bash
   docker exec -it radiology-backend-local python seed_qdrant.py
   ```

### Qdrant connection failed

Check network connectivity:
```bash
docker exec -it radiology-backend-local ping qdrant
```

Restart Qdrant:
```bash
docker-compose -f docker-compose.local.yml restart qdrant
```

## Performance

- **Embedding Speed**: ~10ms per query
- **Search Speed**: ~5ms for top-3 results
- **Impact on Report Generation**: +15ms total

## Future Enhancements

Potential improvements:
- Automatic case indexing from generated reports
- User feedback loop to improve relevance
- Cross-lingual similarity search
- Fine-tuned embeddings for radiology domain
- Relevance scoring visualization in UI

---

**RAG Status**: ✅ Fully Functional (after seeding)
