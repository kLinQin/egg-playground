import { useEffect, useState } from 'react';
import type { B2Config } from '../types';

const KEY_ID_KEY = 'webden-b2-key-id';
const APP_KEY_KEY = 'webden-b2-app-key';
const BUCKET_KEY = 'webden-b2-bucket';
const ENDPOINT_KEY = 'webden-b2-endpoint';
const REGION_KEY = 'webden-b2-region';

function read(key: string): string {
   try {
      return localStorage.getItem(key) ?? '';
   } catch {
      return '';
   }
}

export function useB2Auth() {
   const [keyId, setKeyId] = useState(() => read(KEY_ID_KEY));
   const [applicationKey, setApplicationKey] = useState(() => read(APP_KEY_KEY));
   const [bucket, setBucket] = useState(() => read(BUCKET_KEY));
   const [endpoint, setEndpoint] = useState(() => read(ENDPOINT_KEY));
   const [region, setRegion] = useState(() => read(REGION_KEY));

   useEffect(() => {
      try {
         if (keyId) localStorage.setItem(KEY_ID_KEY, keyId);
         else localStorage.removeItem(KEY_ID_KEY);
      } catch {
         /* ignore */
      }
   }, [keyId]);

   useEffect(() => {
      try {
         if (applicationKey) localStorage.setItem(APP_KEY_KEY, applicationKey);
         else localStorage.removeItem(APP_KEY_KEY);
      } catch {
         /* ignore */
      }
   }, [applicationKey]);

   useEffect(() => {
      try {
         if (bucket) localStorage.setItem(BUCKET_KEY, bucket);
         else localStorage.removeItem(BUCKET_KEY);
      } catch {
         /* ignore */
      }
   }, [bucket]);

   useEffect(() => {
      try {
         if (endpoint) localStorage.setItem(ENDPOINT_KEY, endpoint);
         else localStorage.removeItem(ENDPOINT_KEY);
      } catch {
         /* ignore */
      }
   }, [endpoint]);

   useEffect(() => {
      try {
         if (region) localStorage.setItem(REGION_KEY, region);
         else localStorage.removeItem(REGION_KEY);
      } catch {
         /* ignore */
      }
   }, [region]);

   const clearAll = () => {
      setKeyId('');
      setApplicationKey('');
      setBucket('');
      setEndpoint('');
      setRegion('');
      localStorage.removeItem(KEY_ID_KEY);
      localStorage.removeItem(APP_KEY_KEY);
      localStorage.removeItem(BUCKET_KEY);
      localStorage.removeItem(ENDPOINT_KEY);
      localStorage.removeItem(REGION_KEY);
   };

   const config: B2Config = {
      keyId,
      applicationKey,
      bucket,
      endpoint,
      region,
   };

   const isComplete =
      !!keyId && !!applicationKey && !!bucket && !!endpoint && !!region;

   return {
      keyId,
      setKeyId,
      applicationKey,
      setApplicationKey,
      bucket,
      setBucket,
      endpoint,
      setEndpoint,
      region,
      setRegion,
      config,
      isComplete,
      clearAll,
   };
}