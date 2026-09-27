import mongoose from 'mongoose';

const HeaderItemSchema = new mongoose.Schema({
  key: { type: String, trim: true, default: '' },
  value: { type: String, trim: true, default: '' },
  enabled: { type: Boolean, default: true }
}, { _id: false });

const StageItemSchema = new mongoose.Schema({
  duration: { type: String, required: true, default: '10s' },
  target: { type: Number, required: true, default: 50 }
}, { _id: false });

const ThresholdItemSchema = new mongoose.Schema({
  metric: { type: String, default: 'http_req_duration' },
  operator: { 
    type: String, 
    enum: ['p95<', 'p99<', 'avg<', 'max<', 'rate<'], 
    default: 'p95<' 
  },
  value: { type: Number, default: 500 }
}, { _id: false });

const TestConfigSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, default: 'Untitled Load Test' },
  description: { type: String, default: '' },
  targetUrl: { type: String, required: true, trim: true },
  httpMethod: { 
    type: String, 
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'], 
    default: 'GET' 
  },
  headers: [HeaderItemSchema],
  auth: {
    authType: { type: String, enum: ['none', 'bearer', 'basic'], default: 'none' },
    token: { type: String, default: '' },
    username: { type: String, default: '' },
    password: { type: String, default: '' }
  },
  bodyType: { type: String, enum: ['none', 'json', 'raw'], default: 'none' },
  bodyContent: { type: String, default: '' },
  loadProfile: {
    type: { 
      type: String, 
      enum: ['constant_vus', 'ramping_vus', 'constant_rps'], 
      default: 'constant_vus' 
    },
    vus: { type: Number, default: 50, min: 1, max: 1000 },
    duration: { type: String, default: '30s' },
    stages: [StageItemSchema],
    targetRps: { type: Number, default: 100 }
  },
  thresholds: [ThresholdItemSchema]
}, { 
  timestamps: true 
});

// Avoid recompiling model across Next.js reloads
export default mongoose.models.TestConfig || mongoose.model('TestConfig', TestConfigSchema);
