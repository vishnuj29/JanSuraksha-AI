import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mysqlService } from './mysqlService';

const JWT_SECRET = process.env.JWT_SECRET || 'jansuraksha-enterprise-jwt-super-secret-key-2026';

export interface DBUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: 'user' | 'admin' | 'responder';
  plan: 'Free' | 'Premium';
  safetyScore: number;
  avatar: string;
  location: string;
  joinedDate: string;
}

export interface DBOtpRecord {
  email: string;
  otp: string;
  expiresAt: number;
  attempts: number;
}

export interface DBContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relation: 'Family' | 'Friend' | 'Colleague' | 'Neighbor' | 'Other';
  isPrimary: boolean;
  notifyLevel: 'always' | 'sos_only' | 'never';
  shareLocation: boolean;
  verified: boolean;
  avatar: string;
}

export interface DBSosAlert {
  id: string;
  userId?: string;
  user: string;
  phone: string;
  type: 'Manual SOS' | 'Voice Trigger' | 'Auto-Detect' | 'Fall Detection';
  time: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  status: 'Active' | 'Resolved' | 'False Alarm' | 'Escalated';
  responders: number;
  message?: string;
  triggerWord?: string;
  timestamp: string;
}

export interface DBVaultItem {
  id: string;
  userId: string;
  type: 'photo' | 'video' | 'audio';
  title: string;
  date: string;
  size: string;
  duration?: string;
  emergency: boolean;
  encrypted: boolean;
  dataUrl?: string;
}

export interface DBVoiceConfig {
  userId: string;
  triggerWord: string;
  sensitivity: 'low' | 'medium' | 'high';
  autoSos: boolean;
  continuousListening: boolean;
}

export interface DBIncidentReport {
  id: string;
  userId?: string;
  title: string;
  category: string;
  location: string;
  coordinates?: { latitude: number; longitude: number };
  time: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  upvotes: number;
}

export interface DBPendingRegistration {
  name: string;
  email: string;
  password: string;
  phone: string;
  otp: string;
  expiresAt: number;
  attempts: number;
}

class DBStore {
  private users: Map<string, DBUser> = new Map();
  private otps: Map<string, DBOtpRecord> = new Map();
  private pendingRegistrations: Map<string, DBPendingRegistration> = new Map();
  private contacts: Map<string, DBContact> = new Map();
  private sosAlerts: DBSosAlert[] = [];
  private vaultItems: Map<string, DBVaultItem> = new Map();
  private voiceConfigs: Map<string, DBVoiceConfig> = new Map();
  private incidents: DBIncidentReport[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed default admin and users
    const defaultPasswordHash = bcryptjs.hashSync('Password@123', 10);

    const defaultUsers: DBUser[] = [
      {
        id: 'u-admin-1',
        name: 'Vishnu Jaiswal (Admin)',
        email: 'ec23019@glbitm.ac.in',
        passwordHash: defaultPasswordHash,
        phone: '+91 88740 47462',
        role: 'admin',
        plan: 'Premium',
        safetyScore: 99,
        avatar: 'VJ',
        location: 'Greater Noida, UP',
        joinedDate: 'Jan 01, 2026',
      },
      {
        id: 'u-demo-1',
        name: 'Priya Sharma',
        email: 'priya@example.com',
        passwordHash: defaultPasswordHash,
        phone: '+91 98765 43210',
        role: 'user',
        plan: 'Premium',
        safetyScore: 88,
        avatar: 'PS',
        location: 'Mumbai, MH',
        joinedDate: 'Jan 12, 2026',
      },
      {
        id: 'u-demo-2',
        name: 'Rahul Verma',
        email: 'rahul@example.com',
        passwordHash: defaultPasswordHash,
        phone: '+91 87654 32109',
        role: 'user',
        plan: 'Free',
        safetyScore: 74,
        avatar: 'RV',
        location: 'New Delhi, DL',
        joinedDate: 'Feb 03, 2026',
      },
    ];

    defaultUsers.forEach((u) => this.users.set(u.email.toLowerCase(), u));

    // Seed contacts
    const defaultContacts: DBContact[] = [
      {
        id: 'c1',
        userId: 'u-demo-1',
        name: 'Priya Sharma (Mom)',
        phone: '+91 98765 43210',
        relation: 'Family',
        isPrimary: true,
        notifyLevel: 'always',
        shareLocation: true,
        verified: true,
        avatar: 'PS',
      },
      {
        id: 'c2',
        userId: 'u-demo-1',
        name: 'Rahul Verma',
        phone: '+91 87654 32109',
        relation: 'Friend',
        isPrimary: false,
        notifyLevel: 'sos_only',
        shareLocation: true,
        verified: true,
        avatar: 'RV',
      },
      {
        id: 'c3',
        userId: 'u-demo-1',
        name: 'Anita Singh',
        phone: '+91 76543 21098',
        relation: 'Colleague',
        isPrimary: false,
        notifyLevel: 'sos_only',
        shareLocation: false,
        verified: false,
        avatar: 'AS',
      },
    ];
    defaultContacts.forEach((c) => this.contacts.set(c.id, c));

    // Seed SOS Alerts
    this.sosAlerts = [
      {
        id: 'A001',
        userId: 'u-demo-1',
        user: 'Priya Sharma',
        phone: '+91 98765 43210',
        type: 'Manual SOS',
        time: 'Today · 10:42 PM',
        location: 'Connaught Place, New Delhi',
        coordinates: { latitude: 28.6315, longitude: 77.2167 },
        status: 'Resolved',
        responders: 3,
        message: '🚨 Emergency Alert Triggered',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'A002',
        userId: 'u-demo-2',
        user: 'Rahul Verma',
        phone: '+91 87654 32109',
        type: 'Voice Trigger',
        time: 'Yesterday · 09:15 PM',
        location: 'Indiranagar, Bengaluru',
        coordinates: { latitude: 12.9784, longitude: 77.6408 },
        status: 'Resolved',
        responders: 2,
        triggerWord: 'SURAKSHA',
        message: '🚨 Voice Emergency Triggered',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    // Seed Vault Items
    const defaultVault: DBVaultItem[] = [
      {
        id: 'v1',
        userId: 'u-demo-1',
        type: 'photo',
        title: 'Emergency Capture #1',
        date: 'Apr 5, 2026 · 11:42 PM',
        size: '2.4 MB',
        emergency: true,
        encrypted: true,
      },
      {
        id: 'v2',
        userId: 'u-demo-1',
        type: 'video',
        title: 'Incident Recording',
        date: 'Apr 5, 2026 · 11:43 PM',
        size: '18.7 MB',
        duration: '0:47',
        emergency: true,
        encrypted: true,
      },
      {
        id: 'v3',
        userId: 'u-demo-1',
        type: 'audio',
        title: 'Voice Recording',
        date: 'Apr 5, 2026 · 11:42 PM',
        size: '1.2 MB',
        duration: '1:23',
        emergency: true,
        encrypted: true,
      },
    ];
    defaultVault.forEach((v) => this.vaultItems.set(v.id, v));

    // Seed Incidents
    this.incidents = [
      {
        id: 'inc-1',
        title: 'Dim lighting & non-functional street lamps',
        category: 'Infrastructure',
        location: 'North Sub-corridor',
        time: '1 hour ago',
        severity: 'medium',
        description: 'Street lights off along 400m stretch. Reported to municipal authorities.',
        upvotes: 14,
      },
      {
        id: 'inc-2',
        title: 'Heavy traffic congestion & crowd surge',
        category: 'Crowd Risk',
        location: 'Central Cross Roads',
        time: '3 hours ago',
        severity: 'low',
        description: 'High footfall due to festival gathering. Police patrol deployed.',
        upvotes: 8,
      },
    ];
  }

  // --- Auth & Users ---
  public findUserByEmail(email: string): DBUser | undefined {
    return this.users.get(email.trim().toLowerCase());
  }

  public findUserById(id: string): DBUser | undefined {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  }

  public createUser(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }): DBUser {
    const emailKey = userData.email.trim().toLowerCase();
    if (this.users.has(emailKey)) {
      throw new Error('Email address is already registered');
    }

    const id = `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = bcryptjs.hashSync(userData.password, 10);
    const initials = userData.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'JS';

    const isAdmin = emailKey === 'ec23019@glbitm.ac.in' || emailKey === 'admin@jansuraksha.ai';
    const newUser: DBUser = {
      id,
      name: userData.name.trim(),
      email: emailKey,
      passwordHash,
      phone: userData.phone.trim(),
      role: isAdmin ? 'admin' : 'user',
      plan: isAdmin ? 'Premium' : 'Free',
      safetyScore: isAdmin ? 99 : 78,
      avatar: initials,
      location: 'Local Area',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    };

    this.users.set(emailKey, newUser);

    // Sync to MySQL in background if connected
    mysqlService.insertUser({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      passwordHash: newUser.passwordHash,
      phone: newUser.phone,
      role: newUser.role,
      plan: newUser.plan,
      safetyScore: newUser.safetyScore,
      avatar: newUser.avatar,
      location: newUser.location,
    }).catch(() => {});

    return newUser;
  }

  public updateUser(userId: string, updates: Partial<DBUser>): DBUser {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found');
    const updated = { ...user, ...updates };
    this.users.set(user.email, updated);
    return updated;
  }

  public getAllUsers(): DBUser[] {
    return Array.from(this.users.values());
  }

  public validatePassword(plainPassword: string, hash: string): boolean {
    return bcryptjs.compareSync(plainPassword, hash);
  }

  public comparePassword(plainPassword: string, hash: string): boolean {
    return bcryptjs.compareSync(plainPassword, hash);
  }

  // --- Registration OTP Management ---
  public setPendingRegistration(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }): string {
    const emailKey = data.email.trim().toLowerCase();
    if (this.users.has(emailKey)) {
      throw new Error('This email address is already registered. Please sign in.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.pendingRegistrations.set(emailKey, {
      name: data.name.trim(),
      email: emailKey,
      password: data.password,
      phone: data.phone.trim(),
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
    });

    return otp;
  }

  public getPendingRegistration(email: string): DBPendingRegistration | undefined {
    return this.pendingRegistrations.get(email.trim().toLowerCase());
  }

  public verifyPendingRegistration(email: string, otp: string): DBUser {
    const emailKey = email.trim().toLowerCase();
    const pending = this.pendingRegistrations.get(emailKey);

    if (!pending) {
      throw new Error('No pending registration found for this email. Please submit the registration form again.');
    }

    if (Date.now() > pending.expiresAt) {
      this.pendingRegistrations.delete(emailKey);
      throw new Error('Verification code has expired. Please request a new code.');
    }

    pending.attempts += 1;
    if (pending.attempts > 5) {
      this.pendingRegistrations.delete(emailKey);
      throw new Error('Too many incorrect code attempts. Please register again.');
    }

    if (pending.otp !== otp.trim()) {
      throw new Error('Invalid verification code. Please check your email inbox.');
    }

    // OTP Verified! Create user in persistent database
    this.pendingRegistrations.delete(emailKey);
    return this.createUser({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      phone: pending.phone,
    });
  }

  public resendRegistrationOtp(email: string): { otp: string; name: string } {
    const emailKey = email.trim().toLowerCase();
    const pending = this.pendingRegistrations.get(emailKey);

    if (!pending) {
      throw new Error('No pending registration found for this email.');
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    pending.otp = newOtp;
    pending.expiresAt = Date.now() + 10 * 60 * 1000;
    pending.attempts = 0;
    this.pendingRegistrations.set(emailKey, pending);

    return { otp: newOtp, name: pending.name };
  }

  // --- OTP Management ---
  public setOtp(email: string, otp: string): void {
    const emailKey = email.trim().toLowerCase();
    this.otps.set(emailKey, {
      email: emailKey,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
    });
  }

  public verifyOtp(email: string, otp: string): boolean {
    const emailKey = email.trim().toLowerCase();
    const record = this.otps.get(emailKey);

    if (!record) {
      return false;
    }

    if (Date.now() > record.expiresAt) {
      this.otps.delete(emailKey);
      return false;
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      this.otps.delete(emailKey);
      throw new Error('Too many invalid attempts. Please request a new OTP.');
    }

    if (record.otp === otp.trim()) {
      this.otps.delete(emailKey);
      return true;
    }

    return false;
  }

  // --- JWT Handling ---
  public generateToken(user: DBUser): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  public verifyToken(token: string): { id: string; email: string; name: string; role: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string; role: string };
      return decoded;
    } catch {
      return null;
    }
  }

  // --- Emergency Contacts ---
  public getContacts(userId?: string): DBContact[] {
    const all = Array.from(this.contacts.values());
    if (!userId) return all;
    const userContacts = all.filter((c) => c.userId === userId);
    return userContacts.length > 0 ? userContacts : all; // Fallback to all if empty for testing
  }

  public addContact(contactData: Omit<DBContact, 'id'>): DBContact {
    const id = `c_${Date.now()}`;
    const initials = contactData.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'C';

    const newContact: DBContact = {
      ...contactData,
      id,
      avatar: initials,
    };
    this.contacts.set(id, newContact);
    return newContact;
  }

  public updateContact(id: string, updates: Partial<DBContact>): DBContact {
    const contact = this.contacts.get(id);
    if (!contact) throw new Error('Contact not found');
    const updated = { ...contact, ...updates };
    this.contacts.set(id, updated);
    return updated;
  }

  public deleteContact(id: string): boolean {
    return this.contacts.delete(id);
  }

  // --- SOS Alerts ---
  public createSosAlert(alertData: Omit<DBSosAlert, 'id'>): DBSosAlert {
    const id = `A${String(this.sosAlerts.length + 1).padStart(3, '0')}`;
    const newAlert: DBSosAlert = {
      ...alertData,
      id,
    };
    this.sosAlerts.unshift(newAlert);

    // Sync to MySQL in background if connected
    mysqlService.insertSOSAlert({
      id: newAlert.id,
      userId: newAlert.userId,
      userName: newAlert.userName,
      userEmail: newAlert.userEmail,
      alertType: newAlert.alertType,
      latitude: newAlert.latitude,
      longitude: newAlert.longitude,
      googleMapsUrl: newAlert.googleMapsUrl,
      address: newAlert.locationName,
      status: newAlert.status,
      respondersNotified: newAlert.respondersNotified,
      triggerPhrase: newAlert.triggerPhrase,
    }).catch(() => {});

    return newAlert;
  }

  public getSosAlerts(): DBSosAlert[] {
    return this.sosAlerts;
  }

  public resolveSosAlert(id?: string): boolean {
    if (id) {
      const alert = this.sosAlerts.find((a) => a.id === id);
      if (alert) {
        alert.status = 'Resolved';
        return true;
      }
      return false;
    }
    // Resolve all active alerts
    let updated = false;
    this.sosAlerts.forEach((a) => {
      if (a.status === 'Active' || a.status === 'Escalated') {
        a.status = 'Resolved';
        updated = true;
      }
    });
    return updated;
  }

  // --- Vault ---
  public getVaultItems(userId?: string): DBVaultItem[] {
    const all = Array.from(this.vaultItems.values());
    if (!userId) return all;
    const userItems = all.filter((v) => v.userId === userId);
    return userItems.length > 0 ? userItems : all;
  }

  public addVaultItem(item: Omit<DBVaultItem, 'id'>): DBVaultItem {
    const id = `v_${Date.now()}`;
    const newItem: DBVaultItem = { ...item, id };
    this.vaultItems.set(id, newItem);
    return newItem;
  }

  public deleteVaultItem(id: string): boolean {
    return this.vaultItems.delete(id);
  }

  // --- Voice Config ---
  public getVoiceConfig(userId: string): DBVoiceConfig {
    return (
      this.voiceConfigs.get(userId) || {
        userId,
        triggerWord: 'SURAKSHA',
        sensitivity: 'medium',
        autoSos: true,
        continuousListening: true,
      }
    );
  }

  public setVoiceConfig(config: DBVoiceConfig): DBVoiceConfig {
    this.voiceConfigs.set(config.userId, config);
    return config;
  }

  // --- Incidents ---
  public getIncidents(): DBIncidentReport[] {
    return this.incidents;
  }

  public addIncident(incident: Omit<DBIncidentReport, 'id'>): DBIncidentReport {
    const id = `inc_${Date.now()}`;
    const newInc: DBIncidentReport = { ...incident, id };
    this.incidents.unshift(newInc);
    return newInc;
  }
}

export const dbStore = new DBStore();
export default dbStore;
