import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, EyeOff, AlertTriangle, Fingerprint, Play, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { LanguageSelector } from '@/components/LanguageSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { DemoStartModal } from '@/components/demo/DemoStartModal';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Strong password validation
const passwordSchema = z.string()
  .min(8, 'Mínim 8 caràcters')
  .regex(/[A-Z]/, 'Requereix almenys una majúscula')
  .regex(/[a-z]/, 'Requereix almenys una minúscula')
  .regex(/[0-9]/, 'Requereix almenys un número')
  .regex(/[^A-Za-z0-9]/, 'Requereix almenys un caràcter especial');

// Passkey Login Button Component
function PasskeyLoginButton({ disabled, onSuccess }: { disabled?: boolean; onSuccess?: () => void }) {
  const { isSupported, isAuthenticating, authenticateWithPasskey } = useWebAuthn();
  const { t } = useLanguage();

  if (!isSupported) return null;

  const handlePasskeyLogin = async () => {
    const success = await authenticateWithPasskey('');
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">{t('auth.or')}</span>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full mt-4 gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5"
        onClick={handlePasskeyLogin}
        disabled={disabled || isAuthenticating}
      >
        {isAuthenticating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Fingerprint className="h-4 w-4" />
        )}
        {t('auth.loginWithPasskey')}
      </Button>
    </div>
  );
}

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', confirmPassword: '', fullName: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string[] }>({ score: 0, feedback: [] });
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Check lockout status on mount
  useEffect(() => {
    const storedLockout = localStorage.getItem('auth_lockout_until');
    const storedAttempts = localStorage.getItem('auth_login_attempts');
    
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout, 10);
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem('auth_lockout_until');
        localStorage.removeItem('auth_login_attempts');
      }
    }
    
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts, 10));
    }
  }, []);

  // Lockout countdown
  useEffect(() => {
    if (lockoutUntil && lockoutUntil > Date.now()) {
      const interval = setInterval(() => {
        if (Date.now() >= lockoutUntil) {
          setLockoutUntil(null);
          setLoginAttempts(0);
          localStorage.removeItem('auth_lockout_until');
          localStorage.removeItem('auth_login_attempts');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('Mínim 8 caràcters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Afegeix una majúscula');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Afegeix una minúscula');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('Afegeix un número');

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('Afegeix un caràcter especial (!@#$%...)');

    setPasswordStrength({ score, feedback });
  };

  const loginSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.passwordMin')),
  });

  const signupSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z.string().min(2, t('auth.nameMin')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Les contrasenyes no coincideixen',
    path: ['confirmPassword'],
  });

  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const getRemainingLockoutTime = () => {
    if (!lockoutUntil) return '';
    const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000 / 60);
    return `${remaining} minuts`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Check lockout
    if (lockoutUntil && lockoutUntil > Date.now()) {
      toast.error(`Compte bloquejat. Intenta de nou en ${getRemainingLockoutTime()}`);
      return;
    }
    
    try {
      const validated = loginSchema.parse(loginData);
      setLoading(true);
      
      const { error } = await signIn(validated.email, validated.password);
      
      if (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('auth_login_attempts', newAttempts.toString());

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
          setLockoutUntil(lockoutTime);
          localStorage.setItem('auth_lockout_until', lockoutTime.toString());
          toast.error(`Massa intents fallits. Compte bloquejat durant 15 minuts.`);
        }
      } else {
        // Reset attempts on success
        setLoginAttempts(0);
        localStorage.removeItem('auth_login_attempts');
        localStorage.removeItem('auth_lockout_until');
        navigate('/home');
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const formattedErrors: any = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0]] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = signupSchema.parse(signupData);
      setLoading(true);
      
      const { error } = await signUp(validated.email, validated.password, validated.fullName);
      
      if (!error) {
        setActiveTab('login');
        setSignupData({ email: '', password: '', confirmPassword: '', fullName: '' });
        toast.success('Compte creat correctament! Ara pots iniciar sessió.');
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const formattedErrors: any = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0]] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!forgotEmail || !z.string().email().safeParse(forgotEmail).success) {
      setErrors({ forgotEmail: 'Introdueix un email vàlid' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        toast.error('Error enviant email de recuperació');
      } else {
        setResetEmailSent(true);
        toast.success('Email de recuperació enviat! Revisa la teva safata d\'entrada.');
      }
    } catch (error) {
      toast.error('Error inesperat');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-destructive';
    if (passwordStrength.score <= 3) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength.score <= 2) return 'Feble';
    if (passwordStrength.score <= 3) return 'Mitjana';
    if (passwordStrength.score <= 4) return 'Forta';
    return 'Molt forta';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex justify-center">
            <ObelixiaLogo size="lg" variant="full" animated dark={false} />
          </div>
          <CardDescription className="text-base">
            {t('auth.crmDescription')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {lockoutUntil && lockoutUntil > Date.now() && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Compte bloquejat temporalment. Intenta de nou en {getRemainingLockoutTime()}.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setErrors({}); setResetEmailSent(false); }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
              <TabsTrigger value="forgot">{t('auth.recover')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('auth.email')}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    disabled={loading || (lockoutUntil !== null && lockoutUntil > Date.now())}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      disabled={loading || (lockoutUntil !== null && lockoutUntil > Date.now())}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {loginAttempts > 0 && loginAttempts < MAX_LOGIN_ATTEMPTS && (
                  <p className="text-sm text-amber-600">
                    {t('auth.attemptsRemaining')}: {MAX_LOGIN_ATTEMPTS - loginAttempts}
                  </p>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || (lockoutUntil !== null && lockoutUntil > Date.now())}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.login')}
                </Button>

                <PasskeyLoginButton 
                  disabled={loading || (lockoutUntil !== null && lockoutUntil > Date.now())}
                  onSuccess={() => navigate('/home')}
                />

                <div className="relative mt-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('auth.orTryFirst')}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4 gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  onClick={() => setShowDemoModal(true)}
                >
                  <Play className="h-4 w-4" />
                  {t('demo.tryFree')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={t('auth.namePlaceholder')}
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    disabled={loading}
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    disabled={loading}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => {
                        setSignupData({ ...signupData, password: e.target.value });
                        checkPasswordStrength(e.target.value);
                      }}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {signupData.password && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                          <div 
                            className={`h-full transition-all ${getPasswordStrengthColor()}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{getPasswordStrengthLabel()}</span>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {passwordStrength.feedback.map((fb, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="text-destructive">•</span> {fb}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">{t('auth.confirmPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {signupData.confirmPassword && signupData.password === signupData.confirmPassword && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {t('auth.passwordsNotMatch').replace('no coincideixen', 'coincidents')}
                    </p>
                  )}
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                
                <Button type="submit" className="w-full" disabled={loading || passwordStrength.score < 4}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.createAccount')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="forgot">
              {resetEmailSent ? (
                <div className="text-center space-y-4 py-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Hem enviat un email a <strong>{forgotEmail}</strong> amb instruccions per recuperar la teva contrasenya.
                  </p>
                  <Button variant="outline" onClick={() => { setResetEmailSent(false); setForgotEmail(''); }}>
                    Enviar a un altre email
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email del compte</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="email@exemple.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      disabled={loading}
                    />
                    {errors.forgotEmail && <p className="text-sm text-destructive">{errors.forgotEmail}</p>}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar email de recuperació
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Rebràs un email amb un enllaç per restablir la teva contrasenya.
                  </p>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="text-center text-sm text-muted-foreground">
          {t('auth.footer')}
        </CardFooter>
      </Card>

      <DemoStartModal 
        open={showDemoModal} 
        onOpenChange={setShowDemoModal} 
      />
    </div>
  );
};

export default Auth;
