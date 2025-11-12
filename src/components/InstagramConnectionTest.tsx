'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { APIBook } from '@/lib/firebase/services';

export function InstagramConnectionTest() {
  const [loading, setLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [error, setError] = useState('');

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setAccountInfo(null);

    try {
      const info = await APIBook.instagram.testConnection();
      setAccountInfo(info);
      console.log('✅ Instagram connection successful:', info);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMsg);
      console.error('❌ Instagram connection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Instagram Connection Test</h3>
      
      <Button 
        onClick={testConnection}
        disabled={loading}
        className="w-full mb-4"
      >
        {loading ? 'Testing...' : 'Test Instagram Connection'}
      </Button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">❌ {error}</p>
        </div>
      )}

      {accountInfo && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
          <p className="text-sm font-semibold text-green-800">✅ Connected!</p>
          <div className="space-y-1">
            <p className="text-sm"><strong>Username:</strong> {accountInfo.username}</p>
            <p className="text-sm"><strong>Account ID:</strong> {accountInfo.id}</p>
            {accountInfo.profile_picture_url && (
              <img 
                src={accountInfo.profile_picture_url} 
                alt="Profile" 
                className="w-16 h-16 rounded-full mt-2"
              />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
