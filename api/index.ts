import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Auth Handlers
import loginInitiateHandler from '../src/server/api/auth/login-initiate/POST';
import loginVerifyHandler from '../src/server/api/auth/login-verify/POST';
import loginHandler from '../src/server/api/auth/login/POST';
import registerInitiateHandler from '../src/server/api/auth/register-initiate/POST';
import registerVerifyHandler from '../src/server/api/auth/register-verify/POST';
import registerHandler from '../src/server/api/auth/register/POST';
import resendOtpHandler from '../src/server/api/auth/resend-otp/POST';
import registerResendOtpHandler from '../src/server/api/auth/register-resend-otp/POST';
import meHandler from '../src/server/api/auth/me/GET';

// SOS Handlers
import sosHandler from '../src/server/api/sos/POST';
import sosActiveHandler from '../src/server/api/sos/active/GET';
import sosHistoryHandler from '../src/server/api/sos/history/GET';
import sosResolveHandler from '../src/server/api/sos/resolve/POST';

// Voice Config Handlers
import voiceGetHandler from '../src/server/api/voice/config/GET';
import voicePutHandler from '../src/server/api/voice/config/PUT';

// Contacts Handlers
import contactsGetHandler from '../src/server/api/contacts/GET';
import contactsPostHandler from '../src/server/api/contacts/POST';
import contactsPutHandler from '../src/server/api/contacts/PUT';
import contactsDeleteHandler from '../src/server/api/contacts/DELETE';

// Tracking Handlers
import trackingUpdateHandler from '../src/server/api/tracking/update/POST';
import trackingRiskZonesHandler from '../src/server/api/tracking/risk-zones/GET';

// Vault Handlers
import vaultGetHandler from '../src/server/api/vault/GET';
import vaultPostHandler from '../src/server/api/vault/POST';
import vaultDeleteHandler from '../src/server/api/vault/DELETE';

// Community Handlers
import communityHelpersHandler from '../src/server/api/community/helpers/GET';
import communityIncidentsHandler from '../src/server/api/community/incidents/GET';
import communityRequestHelpHandler from '../src/server/api/community/request-help/POST';

// Assistant Handler
import assistantChatHandler from '../src/server/api/assistant/chat/POST';

// Admin Handlers
import adminStatsHandler from '../src/server/api/admin/stats/GET';
import adminUsersHandler from '../src/server/api/admin/users/GET';
import adminAlertsHandler from '../src/server/api/admin/alerts/GET';
import adminTestEmailHandler from '../src/server/api/admin/test-email/GET';

// Health Handler
import healthHandler from '../src/server/api/health/GET';

const app = express();

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS & Path Normalization headers
app.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, User-Agent');
  res.setHeader('Cache-Control', 'no-cache');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle Vercel rewrite /api/:path* -> query.path
  if (req.query && req.query.path) {
    const subpath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    req.url = `/api/${subpath}`;
  } else if (req.headers['x-forwarded-uri']) {
    req.url = req.headers['x-forwarded-uri'] as string;
  }

  next();
});

// Root / health endpoints
app.get('/', (req, res) => res.json({ status: 'ok', message: 'JanSuraksha API Root Active' }));
app.get('/api', (req, res) => res.json({ status: 'ok', message: 'JanSuraksha API Active' }));

// Helper for mount matching both /api/path and /path
const mount = (route: string, method: 'get' | 'post' | 'put' | 'delete', handler: (req: Request, res: Response) => any) => {
  const apiRoute = route.startsWith('/api') ? route : `/api${route}`;
  const rawRoute = route.startsWith('/api') ? route.replace(/^\/api/, '') : route;

  const wrappedHandler = async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      console.error(`[API ERROR in ${route}]:`, err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: err?.message || 'Internal Server Error',
        });
      }
    }
  };

  app[method](apiRoute, wrappedHandler);
  if (rawRoute && rawRoute !== '') {
    app[method](rawRoute, wrappedHandler);
  }
};

// Health
mount('/health', 'get', healthHandler);

// Auth Routes
mount('/auth/login-initiate', 'post', loginInitiateHandler);
mount('/auth/login-verify', 'post', loginVerifyHandler);
mount('/auth/login', 'post', loginHandler);
mount('/auth/register-initiate', 'post', registerInitiateHandler);
mount('/auth/register-verify', 'post', registerVerifyHandler);
mount('/auth/register', 'post', registerHandler);
mount('/auth/resend-otp', 'post', resendOtpHandler);
mount('/auth/register-resend-otp', 'post', registerResendOtpHandler);
mount('/auth/me', 'get', meHandler);

// SOS Routes
mount('/sos', 'post', sosHandler);
mount('/sos/active', 'get', sosActiveHandler);
mount('/sos/history', 'get', sosHistoryHandler);
mount('/sos/resolve', 'post', sosResolveHandler);

// Voice Routes
mount('/voice/config', 'get', voiceGetHandler);
mount('/voice/config', 'put', voicePutHandler);

// Contacts Routes
mount('/contacts', 'get', contactsGetHandler);
mount('/contacts', 'post', contactsPostHandler);
mount('/contacts', 'put', contactsPutHandler);
mount('/contacts', 'delete', contactsDeleteHandler);

// Tracking Routes
mount('/tracking/update', 'post', trackingUpdateHandler);
mount('/tracking/risk-zones', 'get', trackingRiskZonesHandler);

// Vault Routes
mount('/vault', 'get', vaultGetHandler);
mount('/vault', 'post', vaultPostHandler);
mount('/vault', 'delete', vaultDeleteHandler);

// Community Routes
mount('/community/helpers', 'get', communityHelpersHandler);
mount('/community/incidents', 'get', communityIncidentsHandler);
mount('/community/request-help', 'post', communityRequestHelpHandler);

// Assistant
mount('/assistant/chat', 'post', assistantChatHandler);

// Admin Routes
mount('/admin/stats', 'get', adminStatsHandler);
mount('/admin/users', 'get', adminUsersHandler);
mount('/admin/alerts', 'get', adminAlertsHandler);
mount('/admin/test-email', 'get', adminTestEmailHandler);

// 404 fallback for API
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Endpoint not found: ${req.method} ${req.originalUrl || req.url}` });
});

export default app;
