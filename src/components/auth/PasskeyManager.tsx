import { useState, useEffect } from 'react';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Fingerprint, Trash2, Loader2, KeyRound, Smartphone, Monitor, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ca } from 'date-fns/locale';
import { PasskeyButton } from './PasskeyButton';

interface Passkey {
  id: string;
  credential_id: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
}

export function PasskeyManager() {
  const { user } = useAuth();
  const { isSupported, listPasskeys, removePasskey, isRegistering } = useWebAuthn();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchPasskeys = async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await listPasskeys(user.id);
    setPasskeys(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPasskeys();
  }, [user?.id]);

  const handleRemove = async (credentialId: string) => {
    setRemovingId(credentialId);
    const success = await removePasskey(credentialId);
    if (success) {
      setPasskeys(prev => prev.filter(pk => pk.credential_id !== credentialId));
    }
    setRemovingId(null);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Passkeys
          </CardTitle>
          <CardDescription>
            El teu navegador no és compatible amb WebAuthn/Passkeys.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              Passkeys
            </CardTitle>
            <CardDescription className="mt-1">
              Gestiona les teves claus d'accés sense contrasenya
            </CardDescription>
          </div>
          <PasskeyButton
            mode="register"
            userId={user?.id}
            userEmail={user?.email || ''}
            userName={user?.user_metadata?.full_name || ''}
            onSuccess={fetchPasskeys}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : passkeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <KeyRound className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No tens passkeys registrades</p>
            <p className="text-sm mt-1">
              Afegeix una passkey per accedir sense contrasenya
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {passkeys.map((passkey) => (
              <div
                key={passkey.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {passkey.device_name?.includes('mòbil') || passkey.device_name?.includes('Mobile') ? (
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{passkey.device_name || 'Dispositiu desconegut'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Creat {formatDistanceToNow(new Date(passkey.created_at), { addSuffix: true, locale: ca })}
                      </span>
                      {passkey.last_used_at && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            Últim ús {formatDistanceToNow(new Date(passkey.last_used_at), { addSuffix: true, locale: ca })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={removingId === passkey.credential_id}
                    >
                      {removingId === passkey.credential_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar Passkey</AlertDialogTitle>
                      <AlertDialogDescription>
                        Estàs segur que vols eliminar aquesta passkey? 
                        Hauràs d'utilitzar contrasenya o una altra passkey per accedir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRemove(passkey.credential_id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
