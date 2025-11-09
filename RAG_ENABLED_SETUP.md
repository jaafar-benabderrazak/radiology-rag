# RAG-Enabled Deployment Setup

This branch (`claude/enable-rag-full-dependencies-011CUxUc8fQYhaakz75dBqpu`) includes full RAG (Retrieval-Augmented Generation) functionality with semantic search.

## What's Different from Main Branch

### Main Branch (Lightweight)
- Deployment size: ~200MB
- Build time: ~2 minutes
- RAG: **Disabled** (no similar case suggestions)
- Dependencies: Minimal (no PyTorch, no sentence-transformers)

### This Branch (RAG-Enabled)
- Deployment size: ~800MB-1GB
- Build time: ~5-10 minutes
- RAG: **Enabled** (semantic search for similar cases)
- Dependencies: Full ML stack (PyTorch, sentence-transformers)

## Additional Dependencies Included

```
sentence-transformers==2.2.2  # ~200MB with models
torch==2.0.1                  # ~500MB
transformers==4.35.0          # ~100MB
qdrant-client==1.7.0          # Vector database client
```

## Environment Setup

### Required Environment Variables

You need to set up a Qdrant vector database. You have two options:

#### Option 1: Qdrant Cloud (Recommended for Production)

1. Sign up for free at https://cloud.qdrant.io/
2. Create a new cluster (free tier available)
3. Get your cluster URL and API key
4. Set environment variables in Replit Secrets:

```bash
QDRANT_HOST=your-cluster-id.aws.cloud.qdrant.io
QDRANT_PORT=6333
QDRANT_API_KEY=your-api-key-here
QDRANT_COLLECTION=radiology_reports
```

#### Option 2: Local Qdrant (For Testing)

If you have Qdrant running locally or in a separate container:

```bash
QDRANT_HOST=localhost  # or your Qdrant host
QDRANT_PORT=6333
QDRANT_COLLECTION=radiology_reports
```

### Other Required Variables

Make sure these are also set:

```bash
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=sqlite:///./radiology_db.sqlite  # or PostgreSQL URL
```

## How RAG Works

When a user generates a report:

1. **User Input**: "Patient presents with chest pain and shortness of breath"
2. **Template Selection**: System selects appropriate template (e.g., Chest CT)
3. **Semantic Search**:
   - User input is converted to a 384-dimensional vector embedding
   - Qdrant searches for similar historical cases
   - Top 3 most relevant cases are retrieved
4. **Context Enhancement**: Similar cases are added to the prompt
5. **Report Generation**: Gemini generates report with context from similar cases

## Seeding the Vector Database

To populate the vector database with historical cases:

```bash
cd backend
python seed_qdrant.py
```

This will:
- Load sample radiology cases
- Generate embeddings using sentence-transformers
- Store them in Qdrant for similarity search

## Deployment Notes

### Build Time
- First deployment: ~10-15 minutes (downloads PyTorch)
- Subsequent deployments: ~5-7 minutes (cached)

### Memory Requirements
- Minimum: 2GB RAM
- Recommended: 4GB RAM
- sentence-transformers model loads ~500MB into memory

### Disk Space
- Total deployment size: ~800MB-1GB
- May exceed free tier limits on some platforms

## Testing RAG Functionality

1. Deploy this branch to Replit
2. Login and generate a report
3. Check the backend logs for:
   ```
   ✓ Qdrant connected: your-host:6333
   ✓ Loading embedding model: all-MiniLM-L6-v2
   ```
4. Generate a report with `use_rag: true` (default in auto mode)
5. The generated report should include context from similar cases

## Switching Between Branches

### To Switch to Lightweight Deployment
```bash
git checkout claude/fix-pip-build-environment-011CUxUc8fQYhaakz75dBqpu
```

### To Switch to RAG-Enabled Deployment
```bash
git checkout claude/enable-rag-full-dependencies-011CUxUc8fQYhaakz75dBqpu
```

## Cost Considerations

### Qdrant Cloud
- Free tier: 1GB storage, 1M vectors
- Sufficient for ~10,000 radiology reports
- Paid plans start at $25/month

### Replit Deployment
- Free tier may not support this size
- Consider Replit Hacker plan or deploy elsewhere
- Alternative: Use Docker with fly.io, Railway, or Render

## Troubleshooting

### "Vector service disabled"
- Check QDRANT_HOST and QDRANT_PORT are set
- Verify Qdrant is accessible from deployment
- Check firewall/network settings

### "sentence-transformers not available"
- Deployment may have run out of memory
- Try deploying to a platform with more RAM
- Consider using CPU-only PyTorch build

### Slow Build Times
- Normal for first build (downloads ~800MB)
- Use caching to speed up subsequent builds
- Consider pre-building Docker image

## Performance Comparison

| Feature | Lightweight | RAG-Enabled |
|---------|------------|-------------|
| Report Quality | Excellent | Excellent+ |
| Build Time | 2 min | 10 min |
| Deployment Size | 200MB | 800MB |
| RAM Usage | 512MB | 2-4GB |
| Similar Cases | No | Yes |
| Offline Mode | Yes | No (needs Qdrant) |

## Support

For questions or issues:
1. Check backend logs for error messages
2. Verify all environment variables are set
3. Test Qdrant connection separately
4. Review this documentation

---

**Last Updated**: 2025-11-09
**Branch**: claude/enable-rag-full-dependencies-011CUxUc8fQYhaakz75dBqpu
