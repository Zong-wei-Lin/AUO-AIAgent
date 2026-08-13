import { QdrantClient } from '@qdrant/js-client-rest';
const c = new QdrantClient({ url: 'http://localhost:6333', checkCompatibility: false });
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(c)).filter(m => !m.startsWith('_'));
console.log(methods.sort());
