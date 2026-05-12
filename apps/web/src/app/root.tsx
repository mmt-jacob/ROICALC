import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useAsyncError,
  useRouteError,
} from 'react-router';

import { useButton } from '@react-aria/button';
import {
  type CSSProperties,
  Component,
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import './global.css';

import { serializeError } from 'serialize-error';
import { Toaster, toast } from 'sonner';
import type { Route } from './+types/root';

export const links = () => [];

function InternalErrorBoundary({ error: errorArg }: Route.ErrorBoundaryProps) {
  const routeError = useRouteError();
  const asyncError = useAsyncError();
  const error = errorArg ?? asyncError ?? routeError;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const animateTimer = setTimeout(() => setIsOpen(true), 100);
    return () => clearTimeout(animateTimer);
  }, []);

  const { buttonProps: copyButtonProps } = useButton(
    {
      onPress: useCallback(() => {
        navigator.clipboard.writeText(JSON.stringify(serializeError(error)));
        toast.success('Copied successfully!');
      }, [error]),
    },
    useRef<HTMLButtonElement>(null)
  );

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-md z-50 transition-all duration-500 ease-out ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      style={{ width: '75vw' }}
    >
      <div className="bg-[#18191B] text-[#F2F2F2] rounded-lg p-4 shadow-lg w-full">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-[#F2F2F2] rounded-full flex items-center justify-center">
              <span className="text-black text-[1.125rem] leading-none">!</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <p className="font-light text-[#F2F2F2] text-sm">App Error Detected</p>
            <button
              className="flex flex-row items-center justify-center gap-[4px] outline-none transition-colors rounded-[8px] border-[1px] bg-[#2C2D2F] hover:bg-[#414243] active:bg-[#555658] border-[#414243] text-white text-xs px-[6px] py-[3px] w-fit"
              type="button"
              {...copyButtonProps}
            >
              Copy error
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean; error: unknown | null };

class ErrorBoundaryWrapper extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <InternalErrorBoundary error={this.state.error} params={{}} />;
    }
    return this.props.children;
  }
}

function LoaderWrapper({ loader }: { loader: () => React.ReactNode }) {
  return <>{loader()}</>;
}

export const ClientOnly: FC<{ loader: () => React.ReactNode }> = ({ loader }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <ErrorBoundaryWrapper>
      {isMounted ? <LoaderWrapper loader={loader} /> : null}
    </ErrorBoundaryWrapper>
  );
};

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link rel="icon" href="/src/__create/favicon.png" />
      </head>
      <body>
        <ClientOnly loader={() => children} />
        <Toaster position="bottom-right" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export const ErrorBoundary = InternalErrorBoundary;

export default function App() {
  return <Outlet />;
}
