import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type Props = {
   children: ReactNode;
};

type State = {
   error: Error | null;
   errorInfo: ErrorInfo | null;
};

const DEV = import.meta.env.DEV;

export class ErrorBoundary extends Component<Props, State> {
   state: State = {
      error: null,
      errorInfo: null,
   };

   static getDerivedStateFromError(error: Error): Partial<State> {
      return { error };
   }

   componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      /* log ke console untuk debugging */
      console.error('[ErrorBoundary]', error, errorInfo);
      this.setState({ errorInfo });
   }

   handleReload = () => {
      window.location.reload();
   };

   handleClearStorage = () => {
      if (
         !window.confirm(
            'Hapus semua data lokal (file, token, pengaturan) dan muat ulang?'
         )
      ) {
         return;
      }
      try {
         localStorage.clear();
      } catch {
         // ignore
      }
      window.location.reload();
   };

   render() {
      if (!this.state.error) {
         return this.props.children;
      }

      return (
         <div className="error-boundary">
            <div className="error-boundary__card">
               <h1 className="error-boundary__title">Terjadi Kesalahan</h1>
               <p className="error-boundary__message">
                  Aplikasi mengalami error yang tidak terduga. Coba muat ulang
                  halaman. Jika masalah berlanjut, hapus data lokal.
               </p>

               {DEV && (
                  <>
                     <div className="error-boundary__section">
                        <div className="error-boundary__label">Error</div>
                        <pre className="error-boundary__pre">
                           {this.state.error.message}
                        </pre>
                     </div>

                     {this.state.error.stack && (
                        <div className="error-boundary__section">
                           <div className="error-boundary__label">Stack</div>
                           <pre className="error-boundary__pre">
                              {this.state.error.stack}
                           </pre>
                        </div>
                     )}

                     {this.state.errorInfo?.componentStack && (
                        <div className="error-boundary__section">
                           <div className="error-boundary__label">Component Stack</div>
                           <pre className="error-boundary__pre">
                              {this.state.errorInfo.componentStack}
                           </pre>
                        </div>
                     )}
                  </>
               )}

               <div className="error-boundary__actions">
                  <button
                     className="btn btn--primary"
                     onClick={this.handleReload}
                  >
                     Muat Ulang
                  </button>
                  <button
                     className="btn btn--danger"
                     onClick={this.handleClearStorage}
                  >
                     Hapus Data & Muat Ulang
                  </button>
               </div>
            </div>
         </div>
      );
   }
}