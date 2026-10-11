import { useEffect, useState } from 'react';

const TOKEN_KEY = 'webden-git-token';
const OWNER_KEY = 'webden-git-owner';
const REPO_KEY = 'webden-git-repo';
const BRANCH_KEY = 'webden-git-branch';

function read(key: string): string {
   try {
      return localStorage.getItem(key) ?? '';
   } catch {
      return '';
   }
}

export function useGitAuth() {
   const [token, setToken] = useState(() => read(TOKEN_KEY));
   const [owner, setOwner] = useState(() => read(OWNER_KEY));
   const [repo, setRepo] = useState(() => read(REPO_KEY));
   const [branch, setBranch] = useState(() => read(BRANCH_KEY));

   useEffect(() => {
      try {
         if (token) localStorage.setItem(TOKEN_KEY, token);
         else localStorage.removeItem(TOKEN_KEY);
      } catch {
         // ignore
      }
   }, [token]);

   useEffect(() => {
      try {
         if (owner) localStorage.setItem(OWNER_KEY, owner);
         else localStorage.removeItem(OWNER_KEY);
      } catch {
         // ignore
      }
   }, [owner]);

   useEffect(() => {
      try {
         if (repo) localStorage.setItem(REPO_KEY, repo);
         else localStorage.removeItem(REPO_KEY);
      } catch {
         // ignore
      }
   }, [repo]);

   useEffect(() => {
      try {
         if (branch) localStorage.setItem(BRANCH_KEY, branch);
         else localStorage.removeItem(BRANCH_KEY);
      } catch {
         // ignore
      }
   }, [branch]);

   const clearAll = () => {
      setToken('');
      setOwner('');
      setRepo('');
      setBranch('');
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(OWNER_KEY);
      localStorage.removeItem(REPO_KEY);
      localStorage.removeItem(BRANCH_KEY);
   };

   return {
      token,
      setToken,
      owner,
      setOwner,
      repo,
      setRepo,
      branch,
      setBranch,
      clearAll,
   };
}