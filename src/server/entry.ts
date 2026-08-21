import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Auth Handlers
import loginInitiateHandler from './api/auth/login-initiate/POST.ts';
import loginVerifyHandler from './api/auth/login-verify/POST.ts';
import loginHandler from './api/auth/login/POST.ts';
import registerInitiateHandler from './api/auth/register-initiate/POST.ts';
import registerVerifyHandler from './api/auth/register-verify/POST.ts';
import registerHandler from './api/auth/register/POST.ts';
import resendOtpHandler from './api/auth/resend-otp/POST.ts';
import registerResendOtpHandler from './api/auth/register-resend-otp/POST.ts';
import meHandler from './api/auth/me/GET.ts';

// SOS Handlers
import sosHandler from './api/sos/POST.ts';
import sosActiveHandler from './api/sos/active/GET.ts';
import sosHistoryHandler from './api/sos/history/GET.ts';
import sosResolveHandler from './api/sos/resolve/POST.ts';

// Voice Config Handlers
import voiceGetHandler from './api/voice/config/GET.ts';
import voicePutHandler from './api/voice/config/PUT.ts';

// Contacts Handlers
import contactsGetHandler from './api/contacts/GET.ts';
import contactsPostHandler from './api/contacts/POST.ts';
import contactsPutHandler from './api/contacts/PUT.ts';
import contactsDeleteHandler from './api/contacts/DELETE.ts';

// Tracking Handlers
import trackingUpdateHandler from './api/tracking/update/POST.ts';
import trackingRiskZonesHandler from './api/tracking/risk-zones/GET.ts';

// Vault Handlers
import vaultGetHandler from './api/vault/GET.ts';
import vaultPostHandler from './api/vault/POST.ts';
import vaultDeleteHandler from './api/vault/DELETE.ts';

// Community Handlers
import communityHelpersHandler from './api/community/helpers/GET.ts';
import communityIncidentsHandler from './api/community/incidents/GET.ts';
import communityRequestHelpHandler from './api/community/request-help/POST.ts';

// Assistant Handler
import assistantChatHandler from './api/assistant/chat/POST.ts';

// Admin Handlers
import adminStatsHandler from './api/admin/stats/GET.ts';
import adminUsersHandler from './api/admin/users/GET.ts';
import adminAlertsHandler from './api/admin/alerts/GET.ts';
import adminTestEmailHandler from './api/admin/test-email/GET.ts';

// Health Handler
import healthHandler from './api/health/GET.ts';

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

export default function handler(req: any, res: any) {
  return app(req, res);
}
