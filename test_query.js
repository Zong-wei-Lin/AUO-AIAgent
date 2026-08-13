import { QdrantClient } from '@qdrant/js-client-rest';
const c = new QdrantClient({ url: 'http://localhost:6333', checkCompatibility: false });
console.log(c.query.toString().slice(0, 500));
