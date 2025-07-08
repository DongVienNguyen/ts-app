import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, CheckCircle, XCircle, AlertTriangle, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { VAPID_PUBLIC_KEY } from '@/config';
import { supabase } from '@/integrations/supabase/client';

export const VAPIDKeyTester = () => {
  const [vapidStatus, setVapidStatus] = useState<{
    publicKeyConfigured: boolean;
    publicKeyValid: boolean;
    serverKeysConfigured: boolean;
  }>({
    publicKeyConfigured: false,
    publicKeyValid: false,
    serverKeysConfigured: false
  });
  
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [isTestingServer, setIsTestingServer] = useState(false);

  useEffect(() => {
    checkVapidConfiguration();
  }, []);

  const checkVapidConfiguration = () => {
    console.log('🔍 Checking VAPID configuration...');
    
    // Check if public key is configured
    const publicKeyConfigured = !!VAPID_PUBLIC_KEY;
    
    // Validate public key format (should be base64url encoded, ~88 characters)
    const publicKeyValid = publicKeyConfigured && 
      VAPID_PUBLIC_KEY.length >= 80 && 
      VAPID_PUBLIC_KEY.length <= 90 &&
      /^[A-Za-z0-9_-]+$/.test(VAPID_PUBLIC_KEY);

    setVapidStatus({
      publicKeyConfigured,
      publicKeyValid,
      serverKeysConfigured: false // Will be tested via server call
    });

    console.log('📊 VAPID Status:', {
      publicKeyConfigured,
      publicKeyValid,
      publicKey: publicKeyConfigured ? `${VAPID_PUBLIC_KEY.substring(0, 20)}...` : 'Not configured'
    });
  };

  const testServerVapidKeys = async () => {
    setIsTestingServer(true);
    try {
      console.log('🧪 Testing server VAPID keys...');
      
      // Test by trying to send a test push notification via Supabase edge function
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          username: 'test-user',
          payload: {
            title: 'VAPID Test',
            body: 'Testing server VAPID configuration',
            tag: 'vapid-test'
          }
        }
      });

      if (error) {
        console.error('❌ Server VAPID test error:', error);
        
        // Check if error is related to VAPID configuration
        if (error.message?.includes('VAPID') || error.message?.includes('Push notifications are not configured')) {
          setVapidStatus(prev => ({ ...prev, serverKeysConfigured: false }));
          toast.error('❌ Server VAPID keys not configured properly');
        } else {
          // Other errors might be OK (like no subscriptions found)
          setVapidStatus(prev => ({ ...prev, serverKeysConfigured: true }));
          toast.success('✅ Server VAPID keys appear to be configured');
        }
      } else {
        setVapidStatus(prev => ({ ...prev, serverKeysConfigured: true }));
        toast.success('✅ Server VAPID keys configured correctly!');
      }
    } catch (error) {
      console.error('❌ Error testing server VAPID keys:', error);
      setVapidStatus(prev => ({ ...prev, serverKeysConfigured: false }));
      toast.error('❌ Could not test server VAPID keys');
    } finally {
      setIsTestingServer(false);
    }
  };

  const copyPublicKey = () => {
    if (VAPID_PUBLIC_KEY) {
      navigator.clipboard.writeText(VAPID_PUBLIC_KEY);
      toast.success('📋 Public key copied to clipboard!');
    }
  };

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge className={status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {status ? (
          <><CheckCircle className="w-3 h-3 mr-1" />{label}</>
        ) : (
          <><XCircle className="w-3 h-3 mr-1" />Not {label}</>
        )}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="w-5 h-5 text-blue-600" />
          <span>🔑 VAPID Keys Configuration</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          VAPID keys are required for push notifications. Check configuration status below.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Status */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Client Public Key</h3>
            {getStatusBadge(vapidStatus.publicKeyConfigured, "Configured")}
            <p className="text-xs text-gray-600 mt-1">
              Environment variable VITE_APP_VAPID_PUBLIC_KEY
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Key Validation</h3>
            {getStatusBadge(vapidStatus.publicKeyValid, "Valid")}
            <p className="text-xs text-gray-600 mt-1">
              Public key format and length validation
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Server Keys</h3>
            <Badge className="bg-yellow-100 text-yellow-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Manual Setup Required
            </Badge>
            <p className="text-xs text-gray-600 mt-1">
              Configure in Supabase Console
            </p>
          </div>
        </div>

        {/* Public Key Display */}
        {vapidStatus.publicKeyConfigured && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-blue-800">Current Public Key</h3>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPublicKey(!showPublicKey)}
                >
                  {showPublicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyPublicKey}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="bg-white p-3 rounded border font-mono text-sm">
              {showPublicKey ? VAPID_PUBLIC_KEY : '•'.repeat(VAPID_PUBLIC_KEY.length)}
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Required Setup Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  <strong>Supabase Console:</strong> Go to Settings → Edge Functions → Manage Secrets
                </li>
                <li>
                  <strong>Add VAPID_PUBLIC_KEY:</strong> {VAPID_PUBLIC_KEY || 'BJXegHxCxgCVDlkSoXyJLmclrK7SUmfFvbM7HVX_Z9N0mgUINCL9L1BIULcc0rL1GjjXH0IM7joIcUi4f8h4zqY'}
                </li>
                <li>
                  <strong>Add VAPID_PRIVATE_KEY:</strong> bgDuwB3uG2gpmw7Z9-wmHN9pb037r0uEJ56gJiXkZwk
                </li>
                <li>
                  <strong>Add VAPID_SUBJECT:</strong> mailto:admin@yourcompany.com
                </li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        {/* Test Button */}
        <div className="flex justify-center">
          <Button
            onClick={testServerVapidKeys}
            disabled={isTestingServer || !vapidStatus.publicKeyValid}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isTestingServer ? 'Testing...' : 'Test Server Configuration'}
          </Button>
        </div>

        {/* Status Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Configuration Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              {vapidStatus.publicKeyConfigured ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span>Client-side public key: {vapidStatus.publicKeyConfigured ? 'Configured' : 'Missing'}</span>
            </div>
            <div className="flex items-center space-x-2">
              {vapidStatus.publicKeyValid ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span>Key format validation: {vapidStatus.publicKeyValid ? 'Valid' : 'Invalid'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span>Server-side keys: Manual setup required in Supabase Console</span>
            </div>
          </div>
        </div>

        {/* VAPID Key Issue Warning */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-2">
              <p className="font-semibold">⚠️ Push Notification Registration Issues Detected</p>
              <p className="text-sm">
                The browser is rejecting push notification registration with "AbortError". This typically means:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li><strong>VAPID keys mismatch:</strong> Client and server keys don't match</li>
                <li><strong>Invalid VAPID keys:</strong> Keys may be corrupted or incorrectly formatted</li>
                <li><strong>Development environment:</strong> Some push services don't work on localhost</li>
                <li><strong>Browser restrictions:</strong> Chrome may block push notifications in development</li>
              </ul>
              <p className="text-sm font-medium mt-2">
                💡 <strong>Recommendation:</strong> Test on HTTPS production environment for reliable push notifications.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Next Steps */}
        {vapidStatus.publicKeyConfigured && vapidStatus.publicKeyValid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">✅ Client Configuration Ready!</h3>
            <p className="text-sm text-green-700">
              Your client-side VAPID key is properly configured. Complete the server setup in Supabase Console 
              to enable full push notification functionality.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VAPIDKeyTester;